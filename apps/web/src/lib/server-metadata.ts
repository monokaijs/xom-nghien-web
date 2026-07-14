import type { GameId } from '@/config/games';
import type { PlayerInfo, ServerMetadata, ServerOnlineStatus } from '@/types/server';

interface ServerMetadataQuery {
  game: string;
  metadataUrl: string | null;
}

interface ServerMetadataAdapter {
  getUrl: (server: ServerMetadataQuery) => string | null;
  normalize: (payload: unknown) => ServerMetadata;
}

type JsonRecord = Record<string, unknown>;

export function emptyServerMetadata(): ServerMetadata {
  return {
    status: 'unknown',
    players: {
      online: null,
      total: null,
      list: [],
    },
    map: null,
    ping: null,
    queriedAt: null,
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null);
}

function toCount(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toStatus(value: unknown): ServerOnlineStatus {
  if (typeof value === 'boolean') return value ? 'online' : 'offline';
  if (typeof value === 'number') return value > 0 ? 'online' : 'offline';
  if (typeof value !== 'string') return 'unknown';

  const status = value.trim().toLowerCase();
  if (['online', 'running', 'up', 'healthy', 'active'].includes(status)) return 'online';
  if (['offline', 'stopped', 'down', 'unhealthy', 'inactive'].includes(status)) return 'offline';
  return 'unknown';
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload[0];
  if (!isRecord(payload)) return payload;

  if (Array.isArray(payload.servers)) return payload.servers[0];
  if (isRecord(payload.data)) return payload.data;
  return payload;
}

function normalizePlayers(value: unknown) {
  if (Array.isArray(value)) {
    const list = value
      .filter(isRecord)
      .map((player) => ({
        name: toText(firstDefined(player.name, player.playerName)) || 'Unknown',
        raw: isRecord(player.raw) ? {
          score: toCount(player.raw.score) ?? undefined,
          time: toCount(player.raw.time) ?? undefined,
        } : undefined,
      } satisfies PlayerInfo));

    return { online: list.length, total: null, list };
  }

  if (!isRecord(value)) {
    return { online: toCount(value), total: null, list: [] as PlayerInfo[] };
  }

  const rawList = Array.isArray(value.list) ? value.list : [];
  const list = rawList
    .filter(isRecord)
    .map((player) => ({
      name: toText(firstDefined(player.name, player.playerName)) || 'Unknown',
      raw: isRecord(player.raw) ? {
        score: toCount(player.raw.score) ?? undefined,
        time: toCount(player.raw.time) ?? undefined,
      } : undefined,
    } satisfies PlayerInfo));

  return {
    online: toCount(firstDefined(value.current, value.online, value.count)) ?? (list.length ? list.length : null),
    total: toCount(firstDefined(value.max, value.total, value.capacity)),
    list,
  };
}

/**
 * Normalizes both the legacy tracker response and common per-server JSON shapes.
 * A game can replace this adapter later without changing ServerStatus or the card.
 */
export function normalizeServerMetadata(payload: unknown): ServerMetadata {
  const value = unwrapPayload(payload);
  if (!isRecord(value)) return emptyServerMetadata();

  const players = normalizePlayers(value.players);
  players.online ??= toCount(firstDefined(
    value.currentPlayers,
    value.numPlayers,
    value.numplayers,
    value.onlinePlayers,
    value.playerCount,
  ));
  players.total ??= toCount(firstDefined(
    value.maxPlayers,
    value.maxplayers,
    value.totalPlayers,
    value.capacity,
    value.slots,
  ));

  let status = toStatus(firstDefined(value.online, value.status, value.isOnline, value.running));
  if (status === 'unknown' && players.online !== null) status = 'online';
  if (status === 'offline' && players.online === null) players.online = 0;

  return {
    status,
    players,
    map: toText(firstDefined(value.map, value.currentMap, value.mapName)),
    ping: toCount(firstDefined(value.ping, value.latency)),
    queriedAt: new Date().toISOString(),
  };
}

const httpMetadataAdapter: ServerMetadataAdapter = {
  getUrl: (server) => server.metadataUrl,
  normalize: normalizeServerMetadata,
};

// Keep the registry game-specific even while all three games share the HTTP
// contract. A future direct query only needs to replace its game's adapter.
const metadataAdapters: Partial<Record<GameId, ServerMetadataAdapter>> = {
  cs2: httpMetadataAdapter,
  valheim: httpMetadataAdapter,
  palworld: httpMetadataAdapter,
};

export async function queryServerMetadata(server: ServerMetadataQuery): Promise<ServerMetadata> {
  const adapter = metadataAdapters[server.game as GameId] || httpMetadataAdapter;
  const url = adapter.getUrl(server);
  if (!url) return emptyServerMetadata();

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return emptyServerMetadata();
    return adapter.normalize(await response.json());
  } catch (error) {
    console.error(`Failed to fetch metadata for ${server.game} server:`, error);
    return emptyServerMetadata();
  }
}
