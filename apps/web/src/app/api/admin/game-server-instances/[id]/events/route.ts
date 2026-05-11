import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameServerEvents } from '@xom/db';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const events = await db
    .select()
    .from(gameServerEvents)
    .where(eq(gameServerEvents.instanceId, Number(id)))
    .orderBy(desc(gameServerEvents.created_at))
    .limit(200);

  return NextResponse.json({ events });
});
