import { NextRequest, NextResponse } from 'next/server';
import { db, eq, servers } from '@xom/db';
import { buildBootstrapManifest } from '@/lib/bootstrap-manifest';
import { getServerManagedConfigsById } from '@/lib/utils/server-managed-configs';
import { getServerModsById } from '@/lib/utils/server-mods';

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const serverId = Number(id);
  if (!Number.isSafeInteger(serverId) || serverId < 1) {
    return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
  }

  const [server] = await db.select({ id: servers.id, game: servers.game })
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);
  if (!server || server.game !== 'valheim') {
    return NextResponse.json({ error: 'Valheim server not found' }, { status: 404 });
  }

  try {
    const [mods, configs] = await Promise.all([
      getServerModsById([serverId]),
      getServerManagedConfigsById([serverId]),
    ]);
    const manifest = await buildBootstrapManifest(
      String(serverId),
      mods.get(serverId) || [],
      configs.get(serverId) || [],
    );
    const payload = JSON.parse(Buffer.from(manifest.payload, 'base64').toString('utf8')) as { revision: string };
    const etag = `"${payload.revision}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'private, no-cache' } });
    }
    const response = NextResponse.json(manifest);
    response.headers.set('Cache-Control', 'private, no-cache');
    response.headers.set('ETag', etag);
    return response;
  } catch (error) {
    console.error('Failed to build bootstrap manifest', error);
    return NextResponse.json({ error: 'Bootstrap manifest is temporarily unavailable' }, { status: 503 });
  }
}
