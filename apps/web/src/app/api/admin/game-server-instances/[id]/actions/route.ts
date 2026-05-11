import { NextRequest, NextResponse } from 'next/server';
import { eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameServerInstances } from '@xom/db';
import { queueGameServerAction } from '@/lib/server-management/queue';

const ALLOWED_ACTIONS = ['start', 'stop', 'restart', 'delete', 'retry', 'sync-status'] as const;

export const POST = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const instanceId = Number(id);
  const body = await request.json();
  const action = String(body.action || '') as typeof ALLOWED_ACTIONS[number];

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const instances = await db
    .select()
    .from(gameServerInstances)
    .where(eq(gameServerInstances.id, instanceId))
    .limit(1);
  if (instances.length === 0) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
  }

  const desiredState = action === 'stop'
    ? 'offline'
    : action === 'delete'
      ? 'deleted'
      : 'online';

  if (action === 'retry') {
    await db
      .update(gameServerInstances)
      .set({ status: 'queued', desiredState: 'online', lastError: null })
      .where(eq(gameServerInstances.id, instanceId));
  } else {
    await db
      .update(gameServerInstances)
      .set({ desiredState })
      .where(eq(gameServerInstances.id, instanceId));
  }

  try {
    const job = await queueGameServerAction(instanceId, action);
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to queue action' }, { status: 503 });
  }
});
