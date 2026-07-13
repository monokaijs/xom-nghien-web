import { NextRequest, NextResponse } from 'next/server';
import { db, eq, servers } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { parseGameServerInput } from '@/lib/game-servers';

type RouteContext = { params: Promise<{ id: string }> };

async function findServer(id: number) {
  return db.select().from(servers).where(eq(servers.id, id)).limit(1);
}

export const GET = requireAdmin(async (_request: NextRequest, _user, context: RouteContext) => {
  const { id } = await context.params;
  const rows = await findServer(Number(id));
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  const { address, rcon_password, ...server } = rows[0];
  return NextResponse.json({
    server: {
      ...server,
      gameName: server.name,
      connectionLink: address,
      connectionMethod: server.connectionMethod === 'guidance' ? 'guidance' : 'direct',
      connectionGuide: server.connectionGuide || null,
    },
  });
});

export const PUT = requireAdmin(async (request: NextRequest, _user, context: RouteContext) => {
  const { id } = await context.params;
  const serverId = Number(id);
  const existing = await findServer(serverId);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  try {
    const input = parseGameServerInput(await request.json());
    await db.update(servers).set({
      name: input.name,
      game: input.game,
      address: input.connectionLink,
      connectionMethod: input.connectionMethod,
      connectionGuide: input.connectionGuide,
      description: input.description,
      metadataUrl: input.metadataUrl,
    }).where(eq(servers.id, serverId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.cause?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'This connection link is already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update server' }, { status: 400 });
  }
});

export const DELETE = requireAdmin(async (_request: NextRequest, _user, context: RouteContext) => {
  const { id } = await context.params;
  const serverId = Number(id);
  const existing = await findServer(serverId);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  await db.delete(servers).where(eq(servers.id, serverId));
  return NextResponse.json({ success: true });
});
