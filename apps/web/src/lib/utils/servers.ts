import { asc, db, desc, servers } from '@xom/db';
import { getGame } from '@/config/games';
import { emptyServerMetadata, getCachedServerHeartbeats } from '@/lib/server-heartbeats';

export async function getServersWithStatus(gameId?: string) {
  try {
    const [rows, heartbeats] = await Promise.all([
      db.select({
        id: servers.id,
        name: servers.name,
        game: servers.game,
        connectionLink: servers.address,
        connectionGuide: servers.connectionGuide,
        description: servers.description,
        metadataUrl: servers.metadataUrl,
      }).from(servers).orderBy(asc(servers.sortOrder), desc(servers.created_at)),
      getCachedServerHeartbeats(),
    ]);

    return rows
      .filter((server) => !gameId || server.game === gameId)
      .map((server) => {
        const game = getGame(server.game);
        return {
          id: server.id.toString(),
          name: server.name,
          game: server.game,
          gameName: server.name || game?.name || server.game,
          gameImage: game?.image || '',
          connectionLink: server.connectionLink,
          connectionGuide: server.connectionGuide || null,
          description: server.description,
          metadataUrl: server.metadataUrl,
          metadata: heartbeats[String(server.id)] || emptyServerMetadata(),
        };
      });
  } catch (error) {
    console.error('Error fetching game servers:', error);
    return [];
  }
}
