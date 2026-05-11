import { NextRequest, NextResponse } from 'next/server';
import { eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameConfigurations, gameServerInstances, serverHosts } from '@xom/db';

function sanitizeInstance(instance: typeof gameServerInstances.$inferSelect) {
  const { encryptedRconPassword, encryptedServerPassword, ...safeInstance } = instance;
  return safeInstance;
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const rows = await db
    .select({
      instance: gameServerInstances,
      host: serverHosts,
      configurationName: gameConfigurations.name,
    })
    .from(gameServerInstances)
    .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
    .innerJoin(gameConfigurations, eq(gameServerInstances.configurationId, gameConfigurations.id))
    .where(eq(gameServerInstances.id, Number(id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
  }

  const { encryptedPrivateKey, ...safeHost } = rows[0].host;
  return NextResponse.json({
    instance: {
      ...sanitizeInstance(rows[0].instance),
      host: safeHost,
      configurationName: rows[0].configurationName,
    },
  });
});
