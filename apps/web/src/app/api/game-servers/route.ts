import { NextResponse } from 'next/server';
import { db, desc, servers } from '@xom/db';
import { getGame } from '@/config/games';

export async function GET() {
  const rows = await db.select({
    id: servers.id,
    name: servers.name,
    game: servers.game,
    connectionLink: servers.address,
    connectionGuide: servers.connectionGuide,
    description: servers.description,
    metadataUrl: servers.metadataUrl,
    created_at: servers.created_at,
  }).from(servers).orderBy(desc(servers.created_at));

  return NextResponse.json({
    servers: rows.map((server) => {
      const game = getGame(server.game);
      return {
        ...server,
        gameName: server.name || game?.name || server.game,
        gameImage: game?.image || null,
        connectionGuide: server.connectionGuide || null,
      };
    }),
  });
}
