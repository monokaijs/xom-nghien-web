import { NextRequest, NextResponse } from 'next/server';
import { db, eq, serverManagedConfigs, serverMods, servers } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { parseGameServerInput } from '@/lib/game-servers';
import { parseServerManagedConfigs } from '@/lib/server-managed-configs';
import { getServerManagedConfigsById } from '@/lib/utils/server-managed-configs';
import { getServerModsById } from '@/lib/utils/server-mods';

type RouteContext = { params: Promise<{ id: string }> };

async function findServer(id: number) {
  return db.select().from(servers).where(eq(servers.id, id)).limit(1);
}

export const GET = requireAdmin(async (_request: NextRequest, _user, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const rows = await findServer(Number(id));
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const { address, rcon_password, connectionHost, connectionPort, joinPassword, ...server } = rows[0];
    const [mods, managedConfigs] = await Promise.all([
      getServerModsById([server.id]),
      getServerManagedConfigsById([server.id]),
    ]);
    return NextResponse.json({
      server: {
        ...server,
        gameName: server.name,
        connectionLink: address,
        connectionHost,
        connectionPort,
        joinPassword,
        connectionGuide: server.connectionGuide || null,
        rconConfigured: Boolean(server.rconHost && server.rconPort && rcon_password),
        mods: mods.get(server.id) || [],
        managedConfigs: managedConfigs.get(server.id) || [],
      },
    });
  } catch (error) {
    console.error('Failed to load managed server', error);
    return NextResponse.json({ error: 'Failed to load server' }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (request: NextRequest, _user, context: RouteContext) => {
  const { id } = await context.params;
  const serverId = Number(id);
  const existing = await findServer(serverId);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const input = parseGameServerInput(body);
    const managedConfigs = body.managedConfigs === undefined
      ? null
      : parseServerManagedConfigs(body.managedConfigs, input.game, input.mods);
    await db.transaction(async (transaction) => {
      await transaction.update(servers).set({
        name: input.name,
        game: input.game,
        address: input.connectionLink,
        connectionHost: input.connectionHost,
        connectionPort: input.connectionPort,
        joinPassword: input.joinPassword,
        connectionGuide: input.connectionGuide,
        description: input.description,
        metadataUrl: input.metadataUrl,
      }).where(eq(servers.id, serverId));

      await transaction.delete(serverMods).where(eq(serverMods.serverId, serverId));
      if (input.mods.length > 0) {
        await transaction.insert(serverMods).values(input.mods.map((mod, sortOrder) => ({
          serverId,
          ...mod,
          sortOrder,
        })));
      }

      if (managedConfigs !== null) {
        await transaction.delete(serverManagedConfigs).where(eq(serverManagedConfigs.serverId, serverId));
        if (managedConfigs.length > 0) {
          await transaction.insert(serverManagedConfigs).values(managedConfigs.map((config, sortOrder) => ({
            serverId,
            ...config,
            sortOrder,
          })));
        }
      }
    });

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
