import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { vpsInstances, tempGameServers, lobbies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthUser } from '@/lib/auth';
import { VpsManager } from '@/lib/vps-manager';

export const DELETE = requireAuth(async (
  request: NextRequest,
  user: AuthUser,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;
  const lobbyId = parseInt(id);

  try {
    const result = await db.select({
      id: lobbies.id,
      createdBy: lobbies.createdBy,
      tempGameServerId: lobbies.tempGameServerId,
      containerId: tempGameServers.containerId,
      vpsId: tempGameServers.vpsId,
      vpsIp: vpsInstances.ip,
      vpsPort: vpsInstances.port,
      vpsUsername: vpsInstances.username,
      vpsPrivateKey: vpsInstances.privateKey,
    })
    .from(lobbies)
    .leftJoin(tempGameServers, eq(lobbies.tempGameServerId, tempGameServers.id))
    .leftJoin(vpsInstances, eq(tempGameServers.vpsId, vpsInstances.id))
    .where(eq(lobbies.id, lobbyId))
    .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    const lobby = result[0];

    if (lobby.createdBy !== user.steamId) {
      return NextResponse.json({ error: 'You can only close your own lobby' }, { status: 403 });
    }

    if (lobby.containerId && lobby.vpsIp && lobby.vpsUsername && lobby.vpsPrivateKey) {
      const tempServerId = lobby.containerId;
      const vpsManager = new VpsManager(
        lobby.vpsIp,
        lobby.vpsPort || 22,
        lobby.vpsUsername,
        lobby.vpsPrivateKey
      );

      try {
        await vpsManager.shutdownServer(tempServerId, lobby.containerId);
      } catch (shutdownError) {
        console.error('Error shutting down server:', shutdownError);
      }
    }

    if (lobby.tempGameServerId) {
      await db.delete(tempGameServers).where(eq(tempGameServers.id, lobby.tempGameServerId));
    }

    await db.delete(lobbies).where(eq(lobbies.id, lobbyId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error closing lobby:', error);
    return NextResponse.json({ error: 'Failed to close lobby' }, { status: 500 });
  }
});

