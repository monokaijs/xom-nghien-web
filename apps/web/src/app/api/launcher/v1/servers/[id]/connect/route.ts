import { NextRequest, NextResponse } from 'next/server';
import { db, eq, servers } from '@xom/db';
import { FixedWindowRateLimiter, requestClientKey } from '@/lib/launcher-rate-limit';
import type { LauncherConnectResponse } from '@/types/launcher';

type RouteContext = { params: Promise<{ id: string }> };
const limiter = new FixedWindowRateLimiter(10, 60_000);

export async function POST(request: NextRequest, context: RouteContext) {
  const rate = limiter.consume(requestClientKey(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many connection requests' },
      { status: 429, headers: noStoreHeaders({ 'Retry-After': String(rate.retryAfterSeconds) }) },
    );
  }

  const { id } = await context.params;
  const serverId = Number(id);
  if (!Number.isSafeInteger(serverId) || serverId < 1) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404, headers: noStoreHeaders() });
  }

  const [server] = await db.select({
    id: servers.id,
    game: servers.game,
    host: servers.connectionHost,
    port: servers.connectionPort,
    password: servers.joinPassword,
  }).from(servers).where(eq(servers.id, serverId)).limit(1);

  if (!server || server.game !== 'valheim' || !server.host || !server.port || !server.password) {
    return NextResponse.json({ error: 'Server is not configured for the launcher' }, { status: 404, headers: noStoreHeaders() });
  }

  const body: LauncherConnectResponse = {
    schemaVersion: 1,
    serverId: String(server.id),
    host: server.host,
    port: server.port,
    password: server.password,
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body, { headers: noStoreHeaders() });
}

function noStoreHeaders(extra: Record<string, string> = {}) {
  return {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
    ...extra,
  };
}
