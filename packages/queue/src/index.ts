import { Queue, type JobsOptions } from 'bullmq';

export const SERVER_QUEUE_NAME = 'server-management';

export const SERVER_JOB_NAMES = {
  validateHost: 'server-host.validate',
  provision: 'game-server.provision',
  start: 'game-server.start',
  stop: 'game-server.stop',
  restart: 'game-server.restart',
  delete: 'game-server.delete',
  retry: 'game-server.retry',
  syncStatus: 'game-server.sync-status',
  rcon: 'game-server.rcon',
} as const;

export type ServerQueueJobName = typeof SERVER_JOB_NAMES[keyof typeof SERVER_JOB_NAMES];
export type GameServerAction = 'start' | 'stop' | 'restart' | 'delete' | 'retry' | 'sync-status';

export interface ValidateHostJobPayload {
  hostId: number;
  dbJobId?: number;
}

export interface GameServerJobPayload {
  instanceId: number;
  deploymentId?: number | null;
  dbJobId: number;
}

export interface RconJobPayload extends GameServerJobPayload {
  command: string;
}

export type ServerJobPayload = ValidateHostJobPayload | GameServerJobPayload | RconJobPayload;

export function getRedisConnectionOptions() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for server management queue operations');
  }

  const url = new URL(redisUrl);
  const connection: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db: number;
  } = {
    host: url.hostname,
    port: Number(url.port || 6379),
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0,
  };

  if (url.username) connection.username = decodeURIComponent(url.username);
  if (url.password) connection.password = decodeURIComponent(url.password);

  return connection;
}

export function createServerQueue() {
  return new Queue<ServerJobPayload>(SERVER_QUEUE_NAME, {
    connection: getRedisConnectionOptions(),
  });
}

export async function enqueueServerQueueJob<TPayload extends ServerJobPayload>(
  name: ServerQueueJobName,
  payload: TPayload,
  options: JobsOptions = {},
) {
  const queue = createServerQueue();
  try {
    return await queue.add(name, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 7 * 24 * 60 * 60,
        count: 1000,
      },
      removeOnFail: {
        age: 30 * 24 * 60 * 60,
        count: 2000,
      },
      ...options,
    });
  } finally {
    await queue.close();
  }
}
