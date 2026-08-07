import { getModCatalog } from '@/config/games';
import type { ServerMod } from '@/types/server';

interface ThunderstoreVersion {
  name: string;
  description: string;
  icon: string;
  version_number: string;
  downloads: number;
  is_active: boolean;
}

interface ThunderstorePackage {
  name: string;
  owner: string;
  package_url: string;
  rating_score: number;
  is_pinned: boolean;
  is_deprecated: boolean;
  has_nsfw_content: boolean;
  versions: ThunderstoreVersion[];
}

interface ThunderstoreExperimentalPackage {
  namespace: string;
  name: string;
  package_url: string;
  rating_score: number | string;
  is_pinned: boolean;
  is_deprecated: boolean;
  total_downloads: number | string;
  latest: ThunderstoreVersion;
  community_listings: Array<{
    community: string;
    has_nsfw_content: boolean;
    review_status: 'unreviewed' | 'approved' | 'rejected';
  }>;
}

export interface ModSearchResult extends Omit<ServerMod, 'requirement'> {
  downloads: number;
  rating: number;
}

interface CatalogEntry extends ModSearchResult {
  searchName: string;
  searchOwner: string;
  searchDescription: string;
  pinned: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const catalogCache = new Map<string, { expiresAt: number; entries: CatalogEntry[] }>();
const catalogLoads = new Map<string, Promise<CatalogEntry[]>>();

export async function searchThunderstoreMods(game: string, query: string): Promise<ModSearchResult[]> {
  const catalog = getModCatalog(game);
  if (!catalog || catalog.provider !== 'thunderstore') {
    throw new Error('The selected game does not have a supported mod catalog');
  }

  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  if (normalized.length > 100) throw new Error('Search must be 100 characters or fewer');

  // Community catalogs omit packages until moderation has completed. Admins can
  // still add a new package immediately by pasting its dependency string or URL.
  const packageRef = parsePackageReference(query);
  if (packageRef) {
    const directResult = await fetchPackageDirectly(catalog.community, packageRef.namespace, packageRef.name);
    if (directResult) return [directResult];
  }

  const entries = await getCatalog(catalog.community);
  return entries
    .map((entry) => ({ entry, score: getMatchScore(entry, normalized) }))
    .filter((result) => result.score !== null)
    .sort((a, b) => (
      (a.score as number) - (b.score as number)
      || Number(b.entry.pinned) - Number(a.entry.pinned)
      || b.entry.rating - a.entry.rating
      || b.entry.downloads - a.entry.downloads
    ))
    .slice(0, 20)
    .map(({ entry: { searchName: _name, searchOwner: _owner, searchDescription: _description, pinned: _pinned, ...result } }) => result);
}

async function getCatalog(community: string) {
  const cached = catalogCache.get(community);
  if (cached && cached.expiresAt > Date.now()) return cached.entries;

  const inFlight = catalogLoads.get(community);
  if (inFlight) return inFlight;

  const load = fetchCatalog(community).finally(() => catalogLoads.delete(community));
  catalogLoads.set(community, load);
  return load;
}

async function fetchCatalog(community: string): Promise<CatalogEntry[]> {
  let packages: ThunderstorePackage[];
  try {
    const response = await fetch(`https://thunderstore.io/c/${encodeURIComponent(community)}/api/v1/package/`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Thunderstore returned ${response.status}`);
    packages = await response.json() as ThunderstorePackage[];
  } catch {
    throw new Error('The mod catalog is temporarily unavailable');
  }

  const entries = packages.flatMap((item): CatalogEntry[] => {
    if (item.is_deprecated || item.has_nsfw_content) return [];
    const latest = item.versions.find((version) => version.is_active);
    if (!latest) return [];

    return [{
      provider: 'thunderstore',
      community,
      namespace: item.owner,
      packageName: item.name,
      displayName: latest.name,
      versionNumber: latest.version_number,
      description: latest.description || null,
      iconUrl: latest.icon || null,
      packageUrl: item.package_url,
      downloads: item.versions.reduce((total, version) => total + (version.downloads || 0), 0),
      rating: item.rating_score || 0,
      searchName: `${latest.name} ${item.name}`.toLowerCase(),
      searchOwner: item.owner.toLowerCase(),
      searchDescription: (latest.description || '').toLowerCase(),
      pinned: item.is_pinned,
    }];
  });

  catalogCache.set(community, { entries, expiresAt: Date.now() + CACHE_TTL_MS });
  return entries;
}

async function fetchPackageDirectly(community: string, namespace: string, name: string): Promise<ModSearchResult | null> {
  try {
    const response = await fetch(
      `https://thunderstore.io/api/experimental/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) return null;

    const item = await response.json() as ThunderstoreExperimentalPackage;
    const listing = item.community_listings.find((candidate) => candidate.community === community);
    if (
      !listing
      || listing.review_status === 'rejected'
      || listing.has_nsfw_content
      || item.is_deprecated
      || !item.latest?.is_active
    ) return null;

    return {
      provider: 'thunderstore',
      community,
      namespace: item.namespace,
      packageName: item.name,
      displayName: item.latest.name,
      versionNumber: item.latest.version_number,
      description: item.latest.description || null,
      iconUrl: item.latest.icon || null,
      packageUrl: item.package_url,
      downloads: Math.max(Number(item.total_downloads) || 0, item.latest.downloads || 0),
      rating: Number(item.rating_score) || 0,
    };
  } catch {
    return null;
  }
}

function parsePackageReference(value: string): { namespace: string; name: string } | null {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    if (url.hostname === 'thunderstore.io' || url.hostname.endsWith('.thunderstore.io')) {
      const parts = url.pathname.split('/').filter(Boolean);
      const marker = parts.includes('p') ? parts.indexOf('p') : parts.indexOf('package');
      if (marker >= 0 && parts[marker + 1] && parts[marker + 2]) {
        return { namespace: parts[marker + 1], name: parts[marker + 2] };
      }
    }
  } catch {
    // Dependency strings are handled below.
  }

  const slashMatch = trimmed.match(/^([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)$/);
  if (slashMatch) return { namespace: slashMatch[1], name: slashMatch[2] };

  const dependencyMatch = trimmed.match(/^([A-Za-z0-9_]+)-([A-Za-z0-9_]+)(?:-\d+\.\d+\.\d+)?$/);
  if (dependencyMatch) return { namespace: dependencyMatch[1], name: dependencyMatch[2] };

  return null;
}

function getMatchScore(entry: CatalogEntry, query: string): number | null {
  if (entry.searchName === query) return 0;
  if (entry.searchName.startsWith(query)) return 1;
  if (entry.searchOwner.startsWith(query)) return 2;
  if (entry.searchName.includes(query)) return 3;
  if (entry.searchOwner.includes(query)) return 4;
  if (entry.searchDescription.includes(query)) return 5;
  return null;
}
