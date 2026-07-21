import { NextRequest, NextResponse } from 'next/server';
import { asc, db, desc, eq, servers, sql } from '@xom/db';
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
  const rows = await db.select().from(servers).orderBy(asc(servers.sortOrder), desc(servers.created_at));
  return NextResponse.json({ servers: rows.map(toResponse) });
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const input = parseGameServerInput(await request.json());
    const [order] = await db.select({
      value: sql<number>`COALESCE(MAX(${servers.sortOrder}), -1) + 1`,
    }).from(servers);
    const result = await db.insert(servers).values({
      name: input.name,
      game: input.game,
      address: input.connectionLink,
      connectionGuide: input.connectionGuide,
      description: input.description,
      metadataUrl: input.metadataUrl,
      sortOrder: Number(order?.value ?? 0),
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

export const PATCH = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const serverIds = Array.isArray(body.serverIds)
      ? body.serverIds.map(Number)
      : [];

    if (
      serverIds.length === 0
      || serverIds.some((id: number) => !Number.isSafeInteger(id) || id < 1)
      || new Set(serverIds).size !== serverIds.length
    ) {
      return NextResponse.json({ error: 'Invalid server order' }, { status: 400 });
    }

    const existing = await db.select({ id: servers.id }).from(servers);
    const existingIds = new Set(existing.map((server) => server.id));
    if (existingIds.size !== serverIds.length || serverIds.some((id: number) => !existingIds.has(id))) {
      return NextResponse.json({ error: 'Server list changed; reload and try again' }, { status: 409 });
    }

    await db.transaction(async (transaction) => {
      for (const [sortOrder, id] of serverIds.entries()) {
        await transaction.update(servers).set({ sortOrder }).where(eq(servers.id, id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reorder servers' }, { status: 400 });
  }
});
