import { getModCatalog } from '@/config/games';
import type { ServerMod } from '@/types/server';

interface ThunderstoreVersion {
  name: string;
  description: string;
  icon: string;
  version_number: string;
  downloads: number;
  is_active: boolean;
  dependencies?: string[];
  download_url?: string;
  file_size?: number;
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
const rawCatalogCache = new Map<string, { expiresAt: number; packages: ThunderstorePackage[] }>();
const rawCatalogLoads = new Map<string, Promise<ThunderstorePackage[]>>();

export interface ResolvedThunderstorePackage {
  coordinate: string;
  namespace: string;
  packageName: string;
  versionNumber: string;
  downloadUrl: string;
  fileSize: number | null;
  dependencies: string[];
}

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
  const packages = await getRawCatalog(community);

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

async function getRawCatalog(community: string): Promise<ThunderstorePackage[]> {
  const cached = rawCatalogCache.get(community);
  if (cached && cached.expiresAt > Date.now()) return cached.packages;
  const inFlight = rawCatalogLoads.get(community);
  if (inFlight) return inFlight;

  const load = (async () => {
    try {
      const response = await fetch(`https://thunderstore.io/c/${encodeURIComponent(community)}/api/v1/package/`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`Thunderstore returned ${response.status}`);
      const packages = await response.json() as ThunderstorePackage[];
      rawCatalogCache.set(community, { packages, expiresAt: Date.now() + CACHE_TTL_MS });
      return packages;
    } catch {
      throw new Error('The mod catalog is temporarily unavailable');
    }
  })().finally(() => rawCatalogLoads.delete(community));
  rawCatalogLoads.set(community, load);
  return load;
}

export async function resolveThunderstorePackages(
  community: string,
  requestedCoordinates: string[],
): Promise<ResolvedThunderstorePackage[]> {
  const catalog = await getRawCatalog(community);
  const packages = new Map(catalog.map((item) => [packageIdentity(item.owner, item.name), item]));
  const requestedLoader = requestedCoordinates
    .map(parseCoordinate)
    .find((coordinate) => packageIdentity(coordinate.namespace, coordinate.packageName) === 'denikson-bepinexpack_valheim');
  const resolved = new Map<string, ResolvedThunderstorePackage>();
  const visiting = new Set<string>();

  const visit = async (rawCoordinate: string): Promise<void> => {
    const parsed = parseCoordinate(rawCoordinate);
    const identity = packageIdentity(parsed.namespace, parsed.packageName);
    // The bootstrap itself is already running under BepInEx. Runtime upgrades
    // remain the responsibility of its one-time Thunderstore dependency.
    if (identity === 'denikson-bepinexpack_valheim') return;
    if (visiting.has(identity)) throw new Error(`Thunderstore dependency cycle at ${rawCoordinate}`);
    const existing = resolved.get(identity);
    if (existing) {
      if (existing.versionNumber !== parsed.versionNumber) {
        throw new Error(`Conflicting versions requested for ${parsed.namespace}-${parsed.packageName}`);
      }
      return;
    }

    const item = packages.get(identity);
    const version = item?.versions.find((candidate) => candidate.version_number === parsed.versionNumber)
      || await fetchExactVersionDirectly(community, parsed.namespace, parsed.packageName, parsed.versionNumber);
    if (!version?.download_url) throw new Error(`Thunderstore package ${rawCoordinate} is unavailable`);
    const dependencies = (version.dependencies || []).map((dependency) => {
      const dependencyParts = parseCoordinate(dependency);
      return packageIdentity(dependencyParts.namespace, dependencyParts.packageName) === 'denikson-bepinexpack_valheim' && requestedLoader
        ? `${requestedLoader.namespace}-${requestedLoader.packageName}-${requestedLoader.versionNumber}`
        : dependency;
    });

    visiting.add(identity);
    resolved.set(identity, {
      coordinate: `${parsed.namespace}-${parsed.packageName}-${parsed.versionNumber}`,
      namespace: parsed.namespace,
      packageName: parsed.packageName,
      versionNumber: parsed.versionNumber,
      downloadUrl: validateThunderstoreDownloadUrl(version.download_url),
      fileSize: Number.isSafeInteger(version.file_size) && Number(version.file_size) >= 0 ? Number(version.file_size) : null,
      dependencies,
    });
    for (const dependency of dependencies) await visit(dependency);
    visiting.delete(identity);
  };

  for (const coordinate of requestedCoordinates) await visit(coordinate);
  return [...resolved.values()].sort((left, right) => left.coordinate.localeCompare(right.coordinate));
}

async function fetchExactVersionDirectly(community: string, namespace: string, name: string, version: string) {
  try {
    const response = await fetch(
      `https://thunderstore.io/api/experimental/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/`,
      { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(20_000) },
    );
    if (!response.ok) return null;
    const item = await response.json() as ThunderstoreExperimentalPackage;
    const listing = item.community_listings.find((candidate) => candidate.community === community);
    if (!listing || listing.review_status === 'rejected' || listing.has_nsfw_content || item.is_deprecated) return null;
    if (
      item.namespace.toLowerCase() !== namespace.toLowerCase()
      || item.name.toLowerCase() !== name.toLowerCase()
      || item.latest.version_number !== version
      || !item.latest.is_active
    ) return null;
    return item.latest;
  } catch {
    return null;
  }
}

function parseCoordinate(coordinate: string) {
  const match = coordinate.match(/^([A-Za-z0-9_]+)-([A-Za-z0-9_]+)-([0-9A-Za-z][0-9A-Za-z.+_-]{0,63})$/);
  if (!match) throw new Error(`Invalid Thunderstore dependency ${coordinate}`);
  return { namespace: match[1], packageName: match[2], versionNumber: match[3] };
}

function packageIdentity(namespace: string, name: string) {
  return `${namespace}-${name}`.toLowerCase();
}

function validateThunderstoreDownloadUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !(url.hostname === 'thunderstore.io' || url.hostname.endsWith('.thunderstore.io'))) {
    throw new Error('Thunderstore returned an untrusted download URL');
  }
  return url.toString();
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
