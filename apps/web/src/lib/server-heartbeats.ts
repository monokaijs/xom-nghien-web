import type { ServerMetadata } from '@/types/server';

interface HeartbeatsResponse {
  statuses?: Record<string, ServerMetadata>;
}

const HEARTBEATS_URL = (process.env.SERVER_HEARTBEATS_URL || 'http://127.0.0.1:3200').replace(/\/$/, '');

export function emptyServerMetadata(): ServerMetadata {
  return {
    status: 'unknown',
    players: { online: null, total: null, list: [] },
    map: null,
    ping: null,
    queriedAt: null,
  };
}

export async function getCachedServerHeartbeats(): Promise<Record<string, ServerMetadata>> {
  try {
    const response = await fetch(`${HEARTBEATS_URL}/servers`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      // The heartbeat endpoint only serializes memory. If it cannot answer this
      // quickly, return unknown/stale web data instead of delaying the page.
      signal: AbortSignal.timeout(250),
    });
    if (!response.ok) return {};
    const payload = await response.json() as HeartbeatsResponse;
    return payload.statuses && typeof payload.statuses === 'object' ? payload.statuses : {};
  } catch (error) {
    console.error('Failed to read cached server heartbeats:', error);
    return {};
  }
}
