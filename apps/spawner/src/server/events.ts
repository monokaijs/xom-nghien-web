import { db, gameServerEvents } from '@xom/db';

export async function recordServerEvent(input: {
  instanceId?: number | null;
  deploymentId?: number | null;
  type: string;
  level?: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(gameServerEvents).values({
    instanceId: input.instanceId || null,
    deploymentId: input.deploymentId || null,
    type: input.type,
    level: input.level || 'info',
    message: input.message,
    metadata: input.metadata || null,
  });
}
