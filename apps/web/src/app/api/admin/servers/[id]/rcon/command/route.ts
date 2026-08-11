import { NextRequest, NextResponse } from 'next/server';
import { db, eq, servers } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { executeRconCommand } from '@/lib/rcon';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (request: NextRequest, _user, context: RouteContext) => {
  const { id: value } = await context.params;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
  }

  const [server] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  if (server.game !== 'cs2') return NextResponse.json({ error: 'RCON management is available for CS2 servers only' }, { status: 400 });
  if (!server.rconHost || !server.rconPort || !server.rcon_password) {
    return NextResponse.json({ error: 'Configure RCON before sending commands' }, { status: 409 });
  }

  try {
    const body = await request.json();
    const command = String(body.command || '').trim();
    if (!command) throw new Error('Enter an RCON command');
    if (command.length > 500) throw new Error('RCON commands must be 500 characters or fewer');
    if (/[\r\n\0]/.test(command)) throw new Error('RCON commands must be a single line');

    const output = await executeRconCommand({
      host: server.rconHost,
      port: server.rconPort,
      password: server.rcon_password,
    }, command);

    return NextResponse.json({ output, executedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RCON command failed';
    const connectionError = /connect|timeout|timed out|ECONN|ENOTFOUND|authentication/i.test(message);
    return NextResponse.json({ error: message }, { status: connectionError ? 502 : 400 });
  }
});
