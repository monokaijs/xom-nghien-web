import { NextRequest, NextResponse } from 'next/server';
import { db, eq, servers } from '@xom/db';
import { requireAdmin } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

function parseServerId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseHost(value: unknown) {
  const host = String(value || '').trim().replace(/^\[|\]$/g, '');
  if (!host || host.length > 255 || /[\s/?#]/.test(host) || host.includes('://')) {
    throw new Error('Enter a valid RCON hostname or IP address');
  }
  return host;
}

function parsePort(value: unknown) {
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('RCON port must be between 1 and 65535');
  }
  return port;
}

export const PATCH = requireAdmin(async (request: NextRequest, _user, context: RouteContext) => {
  const { id: value } = await context.params;
  const id = parseServerId(value);
  if (!id) return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });

  const [server] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  if (server.game !== 'cs2') return NextResponse.json({ error: 'RCON management is available for CS2 servers only' }, { status: 400 });

  try {
    const body = await request.json();
    const host = parseHost(body.host);
    const port = parsePort(body.port);
    const suppliedPassword = typeof body.password === 'string' ? body.password : '';
    if (suppliedPassword.length > 255) throw new Error('RCON password must be 255 characters or fewer');
    const password = suppliedPassword || server.rcon_password;
    if (!password) throw new Error('RCON password is required');

    await db.update(servers).set({
      rconHost: host,
      rconPort: port,
      rcon_password: password,
    }).where(eq(servers.id, id));

    return NextResponse.json({
      success: true,
      rcon: { host, port, configured: true },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save RCON settings' }, { status: 400 });
  }
});

export const DELETE = requireAdmin(async (_request: NextRequest, _user, context: RouteContext) => {
  const { id: value } = await context.params;
  const id = parseServerId(value);
  if (!id) return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });

  const result = await db.update(servers).set({
    rconHost: null,
    rconPort: null,
    rcon_password: null,
  }).where(eq(servers.id, id));

  if (result[0].affectedRows === 0) return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  return NextResponse.json({ success: true });
});
