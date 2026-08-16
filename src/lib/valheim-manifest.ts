import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { servers, valheimManifests, valheimModConfigs } from '@/lib/db/schema';
import type {
  ValheimConfigTarget,
  ValheimManifest,
  ValheimManifestPackage,
  ValheimPublishedConfig,
} from '@/types/valheim';

export const MAX_CONFIGS = 100;
export const MAX_CONFIG_BYTES = 512 * 1024;
export const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;

export class ValheimManifestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeConfigPath(value: unknown): string {
  if (typeof value !== 'string') throw new ValheimManifestError('Config path is required');
  const path = value.trim().replaceAll('\\', '/');
  const parts = path.split('/');
  if (!path || path.startsWith('/') || parts.some((part) =>
    !part || part === '.' || part === '..' || part.endsWith('.') || part.endsWith(' ')
    || /[<>:"|?*\x00-\x1f]/.test(part))) {
    throw new ValheimManifestError('Config path must be a safe path relative to BepInEx/config');
  }
  if (path.length > 512) throw new ValheimManifestError('Config path is too long');
  return path;
}

export function normalizeConfigTarget(value: unknown): ValheimConfigTarget {
  if (value === 'server' || value === 'client' || value === 'both') return value;
  throw new ValheimManifestError('Config target must be server, client, or both');
}

export function normalizeConfigContent(value: unknown): string {
  if (typeof value !== 'string') throw new ValheimManifestError('Config content must be text');
  const content = value.replace(/\r\n?/g, '\n');
  if (Buffer.byteLength(content, 'utf8') > MAX_CONFIG_BYTES)
    throw new ValheimManifestError('Each config is limited to 512 KiB');
  return content;
}

export function validatePackages(value: unknown): ValheimManifestPackage[] {
  if (!Array.isArray(value)) throw new ValheimManifestError('Packages must be a JSON array');
  if (value.length > 500) throw new ValheimManifestError('A manifest is limited to 500 packages');
  const coordinates = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new ValheimManifestError(`Package ${index + 1} is invalid`);
    const item = raw as Record<string, unknown>;
    const namespace = typeof item.namespace === 'string' ? item.namespace.trim() : '';
    const packageName = typeof item.packageName === 'string' ? item.packageName.trim() : '';
    const versionNumber = typeof item.versionNumber === 'string' ? item.versionNumber.trim() : '';
    const coordinate = typeof item.coordinate === 'string' ? item.coordinate.trim() : '';
    if (!namespace || !packageName || !versionNumber || coordinate !== `${namespace}-${packageName}-${versionNumber}`)
      throw new ValheimManifestError(`Package ${index + 1} has inconsistent coordinate fields`);
    const coordinateKey = coordinate.toLowerCase();
    if (coordinates.has(coordinateKey)) throw new ValheimManifestError(`Duplicate package ${coordinate}`);
    coordinates.add(coordinateKey);

    const downloadUrl = typeof item.downloadUrl === 'string' ? item.downloadUrl.trim() : '';
    let url: URL;
    try { url = new URL(downloadUrl); }
    catch { throw new ValheimManifestError(`Package ${coordinate} has an invalid download URL`); }
    if (url.protocol !== 'https:' || !(url.hostname === 'thunderstore.io' || url.hostname.endsWith('.thunderstore.io')))
      throw new ValheimManifestError(`Package ${coordinate} must use an HTTPS Thunderstore URL`);

    if (!Array.isArray(item.dependencies) || item.dependencies.some((dependency) => typeof dependency !== 'string'))
      throw new ValheimManifestError(`Package ${coordinate} dependencies must be strings`);
    const fileSize = item.fileSize == null ? null : Number(item.fileSize);
    if (fileSize !== null && (!Number.isSafeInteger(fileSize) || fileSize < 0 || fileSize > 500 * 1024 * 1024))
      throw new ValheimManifestError(`Package ${coordinate} has an invalid file size`);
    return {
      coordinate,
      namespace,
      packageName,
      versionNumber,
      downloadUrl,
      fileSize,
      dependencies: item.dependencies as string[],
    };
  }).sort((left, right) => left.coordinate.localeCompare(right.coordinate));
}

export async function getValheimServer(serverId: number) {
  if (!Number.isInteger(serverId) || serverId <= 0) throw new ValheimManifestError('Invalid server id');
  const rows = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
  if (!rows.length) throw new ValheimManifestError('Server not found', 404);
  if (rows[0].game.toLowerCase() !== 'valheim') throw new ValheimManifestError('This server is not configured as Valheim', 409);
  return rows[0];
}

export async function ensureValheimManifest(serverId: number) {
  await getValheimServer(serverId);
  let rows = await db.select().from(valheimManifests).where(eq(valheimManifests.server_id, serverId)).limit(1);
  if (rows.length) return rows[0];
  try {
    await db.insert(valheimManifests).values({
      server_id: serverId,
      manifest_id: randomUUID(),
      access_token: randomBytes(24).toString('hex'),
      packages: [],
    });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code !== 'ER_DUP_ENTRY') throw error;
  }
  rows = await db.select().from(valheimManifests).where(eq(valheimManifests.server_id, serverId)).limit(1);
  if (!rows.length) throw new ValheimManifestError('Could not initialize Valheim manifest', 500);
  return rows[0];
}

function configAppliesTo(config: ValheimPublishedConfig, audience: 'server' | 'client'): boolean {
  return config.target === 'both' || config.target === audience;
}

function viewRevision(manifestId: string, packages: ValheimManifestPackage[], configs: ValheimPublishedConfig[], audience: 'server' | 'client') {
  // The dedicated server revision is also the HTTP transport ETag, so it must
  // change for client-only edits that the server needs to download and relay.
  const visibleConfigs = audience === 'server'
    ? configs
    : configs.filter((config) => configAppliesTo(config, audience));
  return sha256(JSON.stringify({
    schemaVersion: 2,
    manifestId,
    packages,
    configs: visibleConfigs,
  }));
}

export async function publishValheimManifest(serverId: number, publishedBy: string): Promise<ValheimManifest> {
  const record = await ensureValheimManifest(serverId);
  const packages = validatePackages(record.packages);
  const drafts = await db.select().from(valheimModConfigs)
    .where(and(eq(valheimModConfigs.server_id, serverId), eq(valheimModConfigs.enabled, 1)));
  if (drafts.length > MAX_CONFIGS) throw new ValheimManifestError(`A manifest is limited to ${MAX_CONFIGS} enabled configs`);

  const serverPaths = new Set<string>();
  const clientPaths = new Set<string>();
  const configs: ValheimPublishedConfig[] = drafts.map((draft) => {
    const path = normalizeConfigPath(draft.path);
    const target = normalizeConfigTarget(draft.target);
    const content = normalizeConfigContent(draft.content);
    const key = path.toLowerCase();
    if ((target === 'server' || target === 'both') && serverPaths.has(key))
      throw new ValheimManifestError(`Duplicate server config path: ${path}`);
    if ((target === 'client' || target === 'both') && clientPaths.has(key))
      throw new ValheimManifestError(`Duplicate client config path: ${path}`);
    if (target === 'server' || target === 'both') serverPaths.add(key);
    if (target === 'client' || target === 'both') clientPaths.add(key);
    const bytes = Buffer.from(content, 'utf8');
    return { path, target, sha256: sha256(bytes), contentBase64: bytes.toString('base64') };
  }).sort((left, right) => `${left.path}:${left.target}`.localeCompare(`${right.path}:${right.target}`));

  const serverRevision = viewRevision(record.manifest_id, packages, configs, 'server');
  const clientRevision = viewRevision(record.manifest_id, packages, configs, 'client');
  const manifest: ValheimManifest = {
    schemaVersion: 2,
    manifestId: record.manifest_id,
    revision: serverRevision,
    clientRevision,
    generatedAt: new Date().toISOString(),
    packages,
    configs,
  };
  const manifestJson = JSON.stringify(manifest);
  if (Buffer.byteLength(manifestJson, 'utf8') > MAX_MANIFEST_BYTES)
    throw new ValheimManifestError('Published manifest exceeds the 8 MiB bootstrap limit');

  await db.update(valheimManifests).set({
    packages,
    published_manifest: manifestJson,
    server_revision: serverRevision,
    client_revision: clientRevision,
    published_at: new Date(),
  }).where(eq(valheimManifests.server_id, serverId));
  console.info(`Published Valheim manifest ${record.manifest_id} by ${publishedBy}`);
  return manifest;
}

export function manifestErrorResponse(error: unknown): { error: string; status: number } {
  if (error instanceof ValheimManifestError) return { error: error.message, status: error.status };
  const duplicate = typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY';
  if (duplicate) return { error: 'A config with that path and target already exists', status: 409 };
  console.error('Valheim manifest error:', error);
  return { error: 'Valheim manifest operation failed', status: 500 };
}
