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

function getMatchScore(entry: CatalogEntry, query: string): number | null {
  if (entry.searchName === query) return 0;
  if (entry.searchName.startsWith(query)) return 1;
  if (entry.searchOwner.startsWith(query)) return 2;
  if (entry.searchName.includes(query)) return 3;
  if (entry.searchOwner.includes(query)) return 4;
  if (entry.searchDescription.includes(query)) return 5;
  return null;
}
