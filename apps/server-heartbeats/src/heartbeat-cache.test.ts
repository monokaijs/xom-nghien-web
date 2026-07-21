import { describe, expect, it, vi } from 'vitest';
import { HeartbeatCache } from './heartbeat-cache.js';
import type { ServerMetadata, ServerTarget } from './types.js';

const target: ServerTarget = {
  id: 7,
  game: 'cs2',
  connectionLink: 'game.example:27015',
  metadataUrl: null,
};

const online: ServerMetadata = {
  status: 'online',
  players: { online: 3, total: 12, list: [] },
  map: 'de_dust2',
  ping: 20,
  queriedAt: '2026-07-21T00:00:00.000Z',
};

describe('HeartbeatCache', () => {
  it('returns immediately while the first refresh is still running', async () => {
    let resolveServers!: (servers: ServerTarget[]) => void;
    const loadServers = vi.fn(() => new Promise<ServerTarget[]>((resolve) => {
      resolveServers = resolve;
    }));
    const cache = new HeartbeatCache(loadServers, vi.fn(async () => online), 15_000);

    const refresh = cache.refresh();
    expect(cache.getSnapshot()).toEqual({ statuses: {}, refreshedAt: null, refreshing: true });

    resolveServers([target]);
    await refresh;
    expect(cache.getSnapshot().statuses['7']).toEqual(online);
  });

  it('serves the previous snapshot while a later refresh is in flight', async () => {
    const updated = { ...online, ping: 35 };
    let resolveMetadata!: (metadata: ServerMetadata) => void;
    const queryServer = vi.fn()
      .mockResolvedValueOnce(online)
      .mockImplementationOnce(() => new Promise<ServerMetadata>((resolve) => {
        resolveMetadata = resolve;
      }));
    const cache = new HeartbeatCache(async () => [target], queryServer, 15_000);

    await cache.refresh();
    const refresh = cache.refresh();
    expect(cache.getSnapshot().statuses['7']).toEqual(online);

    await vi.waitFor(() => expect(queryServer).toHaveBeenCalledTimes(2));
    resolveMetadata(updated);
    await refresh;
    expect(cache.getSnapshot().statuses['7']).toEqual(updated);
  });

  it('keeps stale data when refreshing fails', async () => {
    const loadServers = vi.fn()
      .mockResolvedValueOnce([target])
      .mockRejectedValueOnce(new Error('database unavailable'));
    const cache = new HeartbeatCache(loadServers, vi.fn(async () => online), 15_000);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await cache.refresh();
    await cache.refresh();

    expect(cache.getSnapshot().statuses['7']).toEqual(online);
    consoleError.mockRestore();
  });

  it('starts a background refresh when the 15-second snapshot expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T00:00:00.000Z'));
    const loadServers = vi.fn(async () => [target]);
    const cache = new HeartbeatCache(loadServers, vi.fn(async () => online), 15_000);

    await cache.refresh();
    vi.advanceTimersByTime(14_999);
    expect(cache.getSnapshot().statuses['7']).toEqual(online);
    expect(loadServers).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(cache.getSnapshot().statuses['7']).toEqual(online);
    await cache.refresh();
    expect(loadServers).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
