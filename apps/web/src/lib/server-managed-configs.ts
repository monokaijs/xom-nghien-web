import { createHash } from 'node:crypto';

export interface ParsedManagedConfig {
  path: string;
  contents: string;
  sha256: string;
}

const EDITABLE_EXTENSIONS = new Set(['cfg', 'ini', 'json', 'toml', 'txt', 'xml', 'yaml', 'yml']);
const MAX_FILES = 100;
const MAX_FILE_BYTES = 60 * 1024;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;

export function parseServerManagedConfigs(value: unknown, game: string): ParsedManagedConfig[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error('Managed configs must be a list');
  if (game !== 'valheim' && value.length > 0) throw new Error('Managed configs are only supported for Valheim');
  if (value.length > MAX_FILES) throw new Error(`A server can have at most ${MAX_FILES} managed config files`);

  let totalBytes = 0;
  const seen = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`Managed config ${index + 1} is invalid`);
    }
    const record = raw as Record<string, unknown>;
    const path = normalizeManagedConfigPath(String(record.path || ''));
    const contents = String(record.contents ?? '');
    const bytes = Buffer.byteLength(contents, 'utf8');
    if (bytes > MAX_FILE_BYTES) throw new Error(`${path} exceeds the 60 KiB config limit`);
    totalBytes += bytes;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('Managed configs exceed the 2 MiB total limit');

    const key = path.toLowerCase();
    if (seen.has(key)) throw new Error(`${path} was added more than once`);
    seen.add(key);
    return {
      path,
      contents,
      sha256: createHash('sha256').update(contents, 'utf8').digest('hex'),
    };
  });
}

export function normalizeManagedConfigPath(value: string) {
  let path = value.trim().replaceAll('\\', '/').replace(/^\/+/, '');
  path = path.replace(/^BepInEx\/config\//i, '');
  const parts = path.split('/');
  const extension = parts.at(-1)?.split('.').at(-1)?.toLowerCase() || '';
  if (
    !path
    || path.length > 512
    || parts.some((part) => !part || part === '.' || part === '..')
    || parts.some((part) => /[. ]$/.test(part))
    || /[<>:"|?*\u0000-\u001f]/.test(path)
    || !EDITABLE_EXTENSIONS.has(extension)
  ) {
    throw new Error('Managed config paths must be safe relative paths under BepInEx/config');
  }
  return path;
}
