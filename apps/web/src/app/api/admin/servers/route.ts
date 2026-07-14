import { NextRequest, NextResponse } from 'next/server';
import { db, desc, servers } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { parseGameServerInput } from '@/lib/game-servers';

function toResponse(server: typeof servers.$inferSelect) {
  const { address, rcon_password, ...rest } = server;
  return {
    ...rest,
    gameName: server.name,
    connectionLink: address,
    connectionGuide: server.connectionGuide || null,
  };
}

function isDuplicateConnection(error: any) {
  return error?.cause?.code === 'ER_DUP_ENTRY';
}

export const GET = requireAdmin(async () => {
  const rows = await db.select().from(servers).orderBy(desc(servers.created_at));
  return NextResponse.json({ servers: rows.map(toResponse) });
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const input = parseGameServerInput(await request.json());
    const result = await db.insert(servers).values({
      name: input.name,
      game: input.game,
      address: input.connectionLink,
      connectionGuide: input.connectionGuide,
      description: input.description,
      metadataUrl: input.metadataUrl,
      rcon_password: null,
    });

    return NextResponse.json({ success: true, serverId: result[0].insertId }, { status: 201 });
  } catch (error: any) {
    if (isDuplicateConnection(error)) {
      return NextResponse.json({ error: 'This connection link is already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create server' }, { status: 400 });
  }
});
