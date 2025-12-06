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
      vpsId: tempGameServers.vpsId,
      assignedPort: tempGameServers.assignedPort,
      status: tempGameServers.status,
      rconPassword: tempGameServers.rconPassword,
      containerId: tempGameServers.containerId,
      createdBy: tempGameServers.createdBy,
      created_at: tempGameServers.created_at,
      expires_at: tempGameServers.expires_at,
      vpsIp: vpsInstances.ip,
      vpsName: vpsInstances.name,
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
    let liveStatus = 'offline';
    let playerCount = 0;
    let maxPlayers = 0;
    let mapName = '';

    try {
      const queryResult = await GameDig.query({
        type: 'cs2',
        host: server.vpsIp,
        port: server.assignedPort,
        socketTimeout: 5000,
      });
      liveStatus = 'online';
      playerCount = queryResult.numplayers || 0;
      maxPlayers = queryResult.maxplayers || 0;
      mapName = queryResult.map || '';
    } catch (queryError) {
      liveStatus = 'offline';
    }

    return NextResponse.json({
      server: {
        ...server,
        liveStatus,
        playerCount,
        maxPlayers,
        mapName,
      }
    });
  } catch (error) {
    console.error('Error fetching temp server:', error);
    return NextResponse.json({ error: 'Failed to fetch server' }, { status: 500 });
  }
});

export const DELETE = requireAuth(async (
  request: NextRequest,
  user: AuthUser,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select()
      .from(tempGameServers)
      .where(and(
        eq(tempGameServers.id, parseInt(id)),
        eq(tempGameServers.createdBy, user.steamId)
      ))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    await db.delete(tempGameServers).where(eq(tempGameServers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting temp server:', error);
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 });
  }
});

