import { NextRequest, NextResponse } from 'next/server';
import { asc, db, desc, servers } from '@xom/db';
import { getCachedServerHeartbeats } from '@/lib/server-heartbeats';
import { getServerModsById } from '@/lib/utils/server-mods';
import type { LauncherServerManifest } from '@/types/launcher';

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get('game')?.trim() || 'valheim';
  if (game !== 'valheim') {
    return NextResponse.json({ error: 'Only Valheim is supported by launcher v1' }, { status: 400 });
  }

  const [rows, heartbeats] = await Promise.all([
    db.select({
      id: servers.id,
      name: servers.name,
      game: servers.game,
      host: servers.connectionHost,
      port: servers.connectionPort,
      description: servers.description,
    }).from(servers).orderBy(asc(servers.sortOrder), desc(servers.created_at)),
    getCachedServerHeartbeats(),
  ]);
  const launchable = rows.filter((server) => server.game === 'valheim' && server.host && server.port);
  const mods = await getServerModsById(launchable.map((server) => server.id));

  const body: LauncherServerManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    servers: launchable.map((server) => {
      const serverMods = mods.get(server.id) || [];
      return {
        id: String(server.id),
        name: server.name,
        game: 'valheim',
        host: server.host!,
        port: server.port!,
        description: server.description,
        status: heartbeats[String(server.id)]?.status || 'unknown',
        requiredMods: serverMods.filter((mod) => mod.requirement === 'required'),
        optionalMods: serverMods.filter((mod) => mod.requirement === 'optional'),
      };
    }),
  };

  const response = NextResponse.json(body);
  // The status is live heartbeat data. Do not let a CDN hand the launcher a
  // stale online/offline value that disagrees with the web server card.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
