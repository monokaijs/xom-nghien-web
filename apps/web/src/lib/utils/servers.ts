import { db, desc, servers } from '@xom/db';
import { getGame } from '@/config/games';

export async function getServersWithStatus(gameId?: string) {
  try {
    const rows = await db.select({
      id: servers.id,
      name: servers.name,
      game: servers.game,
      connectionLink: servers.address,
      connectionGuide: servers.connectionGuide,
      description: servers.description,
      metadataUrl: servers.metadataUrl,
    }).from(servers).orderBy(desc(servers.created_at));

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
        };
      });
  } catch (error) {
    console.error('Error fetching game servers:', error);
    return [];
  }
}
