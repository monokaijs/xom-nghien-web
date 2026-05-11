import { eq } from '@xom/db';
import {
  SERVER_JOB_NAMES,
  enqueueServerQueueJob,
  type GameServerAction,
  type ServerQueueJobName,
} from '@xom/queue';
import { db, gameServerInstances, gameServerJobs, serverHostJobs } from '@xom/db';
import { recordServerEvent } from './events';
import type { ServerJobType } from './types';

const GAME_SERVER_JOB_NAMES: Record<ServerJobType | 'rcon', ServerQueueJobName> = {
  provision: SERVER_JOB_NAMES.provision,
  start: SERVER_JOB_NAMES.start,
  stop: SERVER_JOB_NAMES.stop,
  restart: SERVER_JOB_NAMES.restart,
  delete: SERVER_JOB_NAMES.delete,
  retry: SERVER_JOB_NAMES.retry,
  'sync-status': SERVER_JOB_NAMES.syncStatus,
  rcon: SERVER_JOB_NAMES.rcon,
};

export async function enqueueGameServerDbJob(input: {
  dbJobId: number;
  instanceId: number;
  deploymentId?: number | null;
  type: ServerJobType | 'rcon';
  payload?: Record<string, unknown>;
}) {
  const bullmqJob = await enqueueServerQueueJob(GAME_SERVER_JOB_NAMES[input.type], {
    dbJobId: input.dbJobId,
    instanceId: input.instanceId,
    deploymentId: input.deploymentId,
    ...input.payload,
  });

  await db
    .update(gameServerJobs)
    .set({ bullmqJobId: bullmqJob.id ? String(bullmqJob.id) : null })
    .where(eq(gameServerJobs.id, input.dbJobId));

  return bullmqJob;
}

export async function queueGameServerAction(
  instanceId: number,
  action: GameServerAction,
  payload: Record<string, unknown> = {},
) {
  const instances = await db
    .select()
    .from(gameServerInstances)
    .where(eq(gameServerInstances.id, instanceId))
    .limit(1);

  if (instances.length === 0) {
    throw new Error('Server instance not found');
  }

  const instance = instances[0];
  const jobInsert = await db.insert(gameServerJobs).values({
    instanceId,
    deploymentId: instance.deploymentId,
    type: action === 'retry' ? 'retry' : action,
    status: 'queued',
    payload,
  });
  const dbJobId = jobInsert[0].insertId;

  await recordServerEvent({
    instanceId,
    deploymentId: instance.deploymentId,
    type: 'job_queued',
    message: `Queued ${action} job`,
  });

  try {
    const job = await enqueueGameServerDbJob({
      dbJobId,
      instanceId,
      deploymentId: instance.deploymentId,
      type: action === 'retry' ? 'retry' : action,
      payload,
    });

    return { dbJobId, bullmqJobId: job.id ? String(job.id) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(gameServerJobs).set({ status: 'failed', error: message }).where(eq(gameServerJobs.id, dbJobId));
    throw new Error(`Queue enqueue failed: ${message}`);
  }
}

export async function queueRconCommand(instanceId: number, command: string) {
  const instances = await db
    .select()
    .from(gameServerInstances)
    .where(eq(gameServerInstances.id, instanceId))
    .limit(1);

  if (instances.length === 0) {
    throw new Error('Server instance not found');
  }

  const instance = instances[0];
  const jobInsert = await db.insert(gameServerJobs).values({
    instanceId,
    deploymentId: instance.deploymentId,
    type: 'rcon',
    status: 'queued',
    payload: { command },
  });
  const dbJobId = jobInsert[0].insertId;

  await recordServerEvent({
    instanceId,
    deploymentId: instance.deploymentId,
    type: 'rcon_queued',
    message: `Queued RCON command: ${command}`,
  });

  try {
    const job = await enqueueGameServerDbJob({
      dbJobId,
      instanceId,
      deploymentId: instance.deploymentId,
      type: 'rcon',
      payload: { command },
    });
    return { dbJobId, bullmqJobId: job.id ? String(job.id) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(gameServerJobs).set({ status: 'failed', error: message }).where(eq(gameServerJobs.id, dbJobId));
    throw new Error(`Queue enqueue failed: ${message}`);
  }
}

export async function queueHostValidation(hostId: number) {
  const jobInsert = await db.insert(serverHostJobs).values({
    hostId,
    type: 'validate',
    status: 'queued',
    payload: {},
  });
  const dbJobId = jobInsert[0].insertId;

  try {
    const job = await enqueueServerQueueJob(SERVER_JOB_NAMES.validateHost, {
      hostId,
      dbJobId,
    });
    await db
      .update(serverHostJobs)
      .set({ bullmqJobId: job.id ? String(job.id) : null })
      .where(eq(serverHostJobs.id, dbJobId));

    return { dbJobId, bullmqJobId: job.id ? String(job.id) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(serverHostJobs).set({ status: 'failed', error: message }).where(eq(serverHostJobs.id, dbJobId));
    throw new Error(`Queue enqueue failed: ${message}`);
  }
}
