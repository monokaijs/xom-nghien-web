import { db } from '@/lib/database';
import { servers } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

const GAME_NAME_MAP: Record<string, string> = {
  'CS2': 'counterstrike2',
  'CS:GO': 'counterstrike',
  'Minecraft': 'minecraft',
  'Rust': 'rust',
};

function getGameIdentifier(gameName: string): string {
  return GAME_NAME_MAP[gameName] || gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function getServersWithStatus() {
  try {
    const serverList = await db.select().from(servers).orderBy(asc(servers.name));

    if (serverList.length === 0) {
      return [];
    }

    const addressParams = serverList
      .map(server => {
        const game = getGameIdentifier(server.game);
        return `${game}:${server.address}`;
      })
      .join(',');

    const statusUrl = `https://servers.xomnghien.com/?addresses=${addressParams}`;
    
    let statusData: any = { servers: [] };
    try {
      const statusResponse = await fetch(statusUrl, { cache: 'no-store' });
      statusData = await statusResponse.json();
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }

    const serversWithStatus = serverList.map((server, index) => {
      const statusServer = statusData.servers?.[index] || {};

      return {
        id: server.id.toString(),
        name: server.name,
        type: server.game,
        ip: server.address.split(':')[0],
        port: parseInt(server.address.split(':')[1] || '27015'),
        online: statusServer.online || false,
        map: statusServer.map || '',
        players: {
          current: statusServer.players?.current || 0,
          max: statusServer.players?.max || 0,
          list: statusServer.players?.list || [],
        },
        ping: statusServer.ping,
        lastUpdated: new Date().toISOString(),
      };
    });

    return serversWithStatus;
  } catch (error) {
    console.error('Error fetching servers:', error);
    return [];
  }
}

