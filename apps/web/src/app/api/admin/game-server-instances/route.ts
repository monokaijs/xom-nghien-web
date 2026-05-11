import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameConfigurations, gameServerInstances, serverHosts } from '@xom/db';

function sanitizeInstance(instance: typeof gameServerInstances.$inferSelect) {
  const { encryptedRconPassword, encryptedServerPassword, ...safeInstance } = instance;
  return safeInstance;
}

export const GET = requireAdmin(async (request: NextRequest) => {
  const rows = await db
    .select({
      instance: gameServerInstances,
      hostName: serverHosts.name,
      hostPublicAddress: serverHosts.publicAddress,
      configurationName: gameConfigurations.name,
    })
    .from(gameServerInstances)
    .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
    .innerJoin(gameConfigurations, eq(gameServerInstances.configurationId, gameConfigurations.id))
    .orderBy(desc(gameServerInstances.created_at))
    .limit(200);

  return NextResponse.json({
    instances: rows.map((row) => ({
      ...sanitizeInstance(row.instance),
      hostName: row.hostName,
      hostPublicAddress: row.hostPublicAddress,
      configurationName: row.configurationName,
    })),
  });
});
