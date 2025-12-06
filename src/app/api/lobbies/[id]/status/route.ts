import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { vpsInstances, tempGameServers, lobbies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GameDig } from 'gamedig';

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const { id } = await segmentData.params;

  try {
    const result = await db.select({
      id: lobbies.id,
      tempGameServerId: lobbies.tempGameServerId,
      serverIp: vpsInstances.ip,
      serverPort: tempGameServers.assignedPort,
      serverStatus: tempGameServers.status,
      created_at: tempGameServers.created_at,
    })
    .from(lobbies)
    .leftJoin(tempGameServers, eq(lobbies.tempGameServerId, tempGameServers.id))
    .leftJoin(vpsInstances, eq(tempGameServers.vpsId, vpsInstances.id))
    .where(eq(lobbies.id, parseInt(id)))
    .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    const lobby = result[0];
    let status = 'initializing';
    let playerCount = 0;
    let maxPlayers = 0;
    let mapName = '';
    let serverName = '';

    if (lobby.serverIp && lobby.serverPort) {
      const serverCreatedAt = lobby.created_at ? new Date(lobby.created_at).getTime() : 0;
      const timeSinceCreation = Date.now() - serverCreatedAt;
      const isInitializing = timeSinceCreation < 60000;

      try {
        const queryResult = await GameDig.query({
          type: 'cs2',
          host: lobby.serverIp,
          port: lobby.serverPort,
          socketTimeout: 5000,
        });
        status = 'online';
        playerCount = queryResult.numplayers || 0;
        maxPlayers = queryResult.maxplayers || 0;
        mapName = queryResult.map || '';
        serverName = queryResult.name || '';

        if (lobby.serverStatus !== 'online') {
          await db.update(tempGameServers)
            .set({ status: 'online' })
            .where(eq(tempGameServers.id, lobby.tempGameServerId!));
        }
      } catch (queryError) {
        status = isInitializing ? 'initializing' : 'offline';
      }
    }

    return NextResponse.json({
      status,
      playerCount,
      maxPlayers,
      mapName,
      serverName,
    });
  } catch (error) {
    console.error('Error checking lobby status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

