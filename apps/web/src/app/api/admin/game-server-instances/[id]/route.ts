import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import {
  gameConfigurations,
  gameServerDeployments,
  gameServerEvents,
  gameServerInstances,
  gameServerJobs,
  serverHosts,
} from '@xom/db';

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
  const instance = rows[0].instance;
  const [deployment, jobs, events] = await Promise.all([
    instance.deploymentId
      ? db
        .select()
        .from(gameServerDeployments)
        .where(eq(gameServerDeployments.id, instance.deploymentId))
        .limit(1)
        .then((items) => items[0] || null)
      : Promise.resolve(null),
    db
      .select()
      .from(gameServerJobs)
      .where(eq(gameServerJobs.instanceId, Number(id)))
      .orderBy(desc(gameServerJobs.created_at))
      .limit(50),
    db
      .select()
      .from(gameServerEvents)
      .where(eq(gameServerEvents.instanceId, Number(id)))
      .orderBy(desc(gameServerEvents.created_at))
      .limit(200),
  ]);

  return NextResponse.json({
    instance: {
      ...sanitizeInstance(instance),
      host: safeHost,
      configurationName: rows[0].configurationName,
    },
    deployment,
    jobs,
    events,
  });
});
