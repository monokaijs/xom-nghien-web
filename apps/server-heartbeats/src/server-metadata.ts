import { lookup } from 'node:dns/promises';
import { createSocket } from 'node:dgram';
import { parseServerAddress } from './server-address.js';
import type { PlayerInfo, ServerMetadata, ServerOnlineStatus, ServerTarget } from './types.js';

type JsonRecord = Record<string, unknown>;

const PALWORLD_PORT_PROBE_TIMEOUT_MS = 1_500;
const PALWORLD_PORT_PROBE = Buffer.concat([
  Buffer.from([0xff, 0xff, 0xff, 0xff, 0x54]),
  Buffer.from('Source Engine Query\0', 'ascii'),
]);

export function emptyServerMetadata(): ServerMetadata {
  return {
    status: 'unknown',
    players: { online: null, total: null, list: [] },
    map: null,
    ping: null,
    queriedAt: null,
  };
}

function offlineServerMetadata(queriedAt = new Date().toISOString()): ServerMetadata {
  return {
    ...emptyServerMetadata(),
    status: 'offline',
    players: { online: 0, total: null, list: [] },
    queriedAt,
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
    const list = value.filter(isRecord).map(toPlayerInfo);
    return { online: list.length, total: null, list };
  }
  if (!isRecord(value)) {
    return { online: toCount(value), total: null, list: [] as PlayerInfo[] };
  }

  const list = (Array.isArray(value.list) ? value.list : []).filter(isRecord).map(toPlayerInfo);
  return {
    online: toCount(firstDefined(value.current, value.online, value.count)) ?? (list.length ? list.length : null),
    total: toCount(firstDefined(value.max, value.total, value.capacity)),
    list,
  };
}

function toPlayerInfo(player: JsonRecord): PlayerInfo {
  const raw = isRecord(player.raw) ? player.raw : {};
  return {
    name: toText(firstDefined(player.name, player.playerName)) || 'Unknown',
    raw: {
      score: toCount(raw.score) ?? undefined,
      time: toCount(raw.time) ?? undefined,
    },
  };
}

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

async function queryCs2Metadata(connectionLink: string): Promise<ServerMetadata> {
  const server = parseServerAddress(connectionLink);
  if (!server) return emptyServerMetadata();
  const queriedAt = new Date().toISOString();

  try {
    const { GameDig } = await import('gamedig');
    const state = await GameDig.query({
      type: 'counterstrike2',
      host: server.host,
      port: server.port,
      socketTimeout: 1_500,
      attemptTimeout: 3_000,
      maxRetries: 1,
    });
    const players = (state.players || []).map((player) => toPlayerInfo(player as JsonRecord));
    return {
      status: 'online',
      players: {
        online: toCount(state.numplayers) ?? players.length,
        total: toCount(state.maxplayers),
        list: players,
      },
      map: toText(state.map),
      ping: toCount(state.ping),
      queriedAt,
    };
  } catch (error) {
    console.error(`Failed to query CS2 server ${server.address}:`, error);
    return offlineServerMetadata(queriedAt);
  }
}

async function probePalworldPort(host: string, port: number) {
  try {
    const address = await lookup(host);
    return await new Promise<{ reachable: boolean; ping: number | null }>((resolve) => {
      const socket = createSocket(address.family === 6 ? 'udp6' : 'udp4');
      const startedAt = Date.now();
      let finished = false;
      const finish = (reachable: boolean, ping: number | null = null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        socket.removeAllListeners();
        socket.close();
        resolve({ reachable, ping });
      };
      const timeout = setTimeout(() => finish(true), PALWORLD_PORT_PROBE_TIMEOUT_MS);
      socket.once('error', () => finish(false));
      socket.once('message', () => finish(true, Date.now() - startedAt));
      socket.connect(port, address.address, () => {
        socket.send(PALWORLD_PORT_PROBE, (error) => {
          if (error) finish(false);
        });
      });
    });
  } catch {
    return { reachable: false, ping: null };
  }
}

async function queryPalworldMetadata(connectionLink: string): Promise<ServerMetadata> {
  const server = parseServerAddress(connectionLink);
  if (!server) return emptyServerMetadata();
  const result = await probePalworldPort(server.host, server.port);
  return {
    ...emptyServerMetadata(),
    status: result.reachable ? 'online' : 'offline',
    players: { online: result.reachable ? null : 0, total: null, list: [] },
    ping: result.ping,
    queriedAt: new Date().toISOString(),
  };
}

export async function queryServerMetadata(server: ServerTarget): Promise<ServerMetadata> {
  if (server.game === 'cs2' && server.connectionLink && parseServerAddress(server.connectionLink)) {
    return queryCs2Metadata(server.connectionLink);
  }
  if (server.game === 'palworld' && server.connectionLink && parseServerAddress(server.connectionLink)) {
    return queryPalworldMetadata(server.connectionLink);
  }
  if (!server.metadataUrl) return emptyServerMetadata();

  try {
    const response = await fetch(server.metadataUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return offlineServerMetadata();
    return normalizeServerMetadata(await response.json());
  } catch (error) {
    console.error(`Failed to fetch metadata for ${server.game} server:`, error);
    return offlineServerMetadata();
  }
}
