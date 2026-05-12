import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, like, or } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameConfigurations, gameServerInstances, serverHosts } from '@xom/db';

function sanitizeInstance(instance: typeof gameServerInstances.$inferSelect) {
  const { encryptedRconPassword, encryptedServerPassword, ...safeInstance } = instance;
  return safeInstance;
}

export const GET = requireAdmin(async (request: NextRequest) => {
  const params = new URL(request.url).searchParams;
  const gameKey = params.get('gameKey') || '';
  const search = params.get('search') || '';
  const gameKeyCondition = gameKey ? eq(gameServerInstances.gameKey, gameKey) : undefined;
  const searchCondition = search ? or(
    like(gameServerInstances.name, `%${search}%`),
    like(gameServerInstances.connectAddress, `%${search}%`),
    like(serverHosts.name, `%${search}%`),
    like(gameConfigurations.name, `%${search}%`),
  ) : undefined;
  const whereClause = gameKeyCondition && searchCondition
    ? and(gameKeyCondition, searchCondition)
    : gameKeyCondition || searchCondition;

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
    .where(whereClause)
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
