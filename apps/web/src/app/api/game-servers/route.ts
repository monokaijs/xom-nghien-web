import { NextResponse } from 'next/server';
import { and, eq, inArray } from '@xom/db';
import { db } from '@xom/db';
import { gameConfigurations, gameServerInstances, serverHosts } from '@xom/db';

export async function GET() {
  const rows = await db
    .select({
      id: gameServerInstances.id,
      name: gameServerInstances.name,
      gameKey: gameServerInstances.gameKey,
      status: gameServerInstances.status,
      connectAddress: gameServerInstances.connectAddress,
      queryPort: gameServerInstances.queryPort,
      configSnapshot: gameServerInstances.configSnapshot,
      created_at: gameServerInstances.created_at,
      hostName: serverHosts.name,
      hostPublicAddress: serverHosts.publicAddress,
      configurationName: gameConfigurations.name,
    })
    .from(gameServerInstances)
    .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
    .innerJoin(gameConfigurations, eq(gameServerInstances.configurationId, gameConfigurations.id))
    .where(and(
      eq(gameServerInstances.visibility, 'public'),
      inArray(gameServerInstances.status, ['online', 'offline', 'provisioning', 'queued', 'failed']),
    ));

  return NextResponse.json({ servers: rows });
}
