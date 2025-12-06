import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { vpsInstances, tempGameServers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { GameDig } from 'gamedig';

export const GET = requireAuth(async (
  request: NextRequest,
  user: AuthUser,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select({
      id: tempGameServers.id,
      assignedPort: tempGameServers.assignedPort,
      vpsIp: vpsInstances.ip,
    })
    .from(tempGameServers)
    .innerJoin(vpsInstances, eq(tempGameServers.vpsId, vpsInstances.id))
    .where(and(
      eq(tempGameServers.id, parseInt(id)),
      eq(tempGameServers.createdBy, user.steamId)
    ))
    .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const server = result[0];
    let status = 'offline';
    let playerCount = 0;
    let maxPlayers = 0;
    let mapName = '';
    let serverName = '';
    let players: any[] = [];

    try {
      const queryResult = await GameDig.query({
        type: 'cs2',
        host: server.vpsIp,
        port: server.assignedPort,
        socketTimeout: 5000,
      });
      status = 'online';
      playerCount = queryResult.numplayers || 0;
      maxPlayers = queryResult.maxplayers || 0;
      mapName = queryResult.map || '';
      serverName = queryResult.name || '';
      players = queryResult.players || [];
    } catch (queryError) {
      status = 'offline';
    }

    return NextResponse.json({
      status,
      playerCount,
      maxPlayers,
      mapName,
      serverName,
      players,
    });
  } catch (error) {
    console.error('Error checking server status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
});

