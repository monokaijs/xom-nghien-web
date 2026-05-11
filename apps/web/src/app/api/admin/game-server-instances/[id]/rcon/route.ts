import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queueRconCommand } from '@/lib/server-management/queue';

export const POST = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const body = await request.json();
  const command = String(body.command || '').trim();
  if (!command) {
    return NextResponse.json({ error: 'Command is required' }, { status: 400 });
  }

  try {
    const job = await queueRconCommand(Number(id), command);
    return NextResponse.json({ success: true, queued: true, job });
  } catch (error: any) {
    const status = error.message === 'Server instance not found' ? 404 : 503;
    return NextResponse.json({ error: error.message || 'Failed to queue RCON command' }, { status });
  }
});
