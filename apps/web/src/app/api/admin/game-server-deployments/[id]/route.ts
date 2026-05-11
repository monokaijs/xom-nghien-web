import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameServerDeployments, gameServerEvents, gameServerInstances, serverHosts } from '@xom/db';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const deploymentId = Number(id);
  const deployments = await db
    .select()
    .from(gameServerDeployments)
    .where(eq(gameServerDeployments.id, deploymentId))
    .limit(1);

  if (deployments.length === 0) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  const instances = await db
    .select({
      instance: gameServerInstances,
      hostName: serverHosts.name,
      hostPublicAddress: serverHosts.publicAddress,
    })
    .from(gameServerInstances)
    .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
    .where(eq(gameServerInstances.deploymentId, deploymentId))
    .orderBy(desc(gameServerInstances.created_at));

  const events = await db
    .select()
    .from(gameServerEvents)
    .where(eq(gameServerEvents.deploymentId, deploymentId))
    .orderBy(desc(gameServerEvents.created_at))
    .limit(100);

  return NextResponse.json({
    deployment: deployments[0],
    instances: instances.map((row) => ({
      ...row.instance,
      hostName: row.hostName,
      hostPublicAddress: row.hostPublicAddress,
      encryptedRconPassword: undefined,
      encryptedServerPassword: undefined,
    })),
    events,
  });
});
