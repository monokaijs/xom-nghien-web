import path from 'node:path';

export const MAX_DEMO_BYTES = 2 * 1024 * 1024 * 1024;

export function getDemoStorageRoot() {
  return path.resolve(
    process.env.MATCH_DEMO_STORAGE_DIR
      || path.join(process.cwd(), 'storage', 'match-demos'),
  );
}

export function resolveDemoStoragePath(storageKey: string) {
  const root = getDemoStorageRoot();
  const resolved = path.resolve(root, storageKey);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Demo storage key escapes the configured storage root');
  }

  return resolved;
}
