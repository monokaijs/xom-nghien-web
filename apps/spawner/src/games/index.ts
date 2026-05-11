import { cs2SpawnerAdapter } from './cs2-adapter';

const adapters = {
  cs2: cs2SpawnerAdapter,
};

export function getSpawnerGameAdapter(gameKey: string) {
  const adapter = adapters[gameKey as keyof typeof adapters];
  if (!adapter) {
    throw new Error(`Unsupported game adapter: ${gameKey}`);
  }
  return adapter;
}
