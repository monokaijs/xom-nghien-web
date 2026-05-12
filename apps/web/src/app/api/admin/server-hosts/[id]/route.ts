import { NextRequest, NextResponse } from 'next/server';
import { eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameServerInstances, serverHosts } from '@xom/db';
import { encryptSecret } from '@xom/db/crypto';
import { queueHostValidation } from '@/lib/server-management/queue';

function sanitizeHost(host: typeof serverHosts.$inferSelect) {
  const { encryptedPrivateKey, ...safeHost } = host;
  return safeHost;
}

function isDuplicateHostError(error: any) {
  const cause = error?.cause;
  const message = String(cause?.sqlMessage || cause?.message || '');
  return cause?.code === 'ER_DUP_ENTRY' && message.includes('unique_server_host_ssh');
}

function logServerHostWriteError(action: string, error: any) {
  const cause = error?.cause;
  console.error(`Error ${action} server host`, {
    code: cause?.code,
    sqlState: cause?.sqlState,
    sqlMessage: cause?.sqlMessage,
  });
}

async function queueValidationSafely(hostId: number) {
  try {
    return await queueHostValidation(hostId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error queueing server host validation', { message });
    return null;
  }
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const rows = await db.select().from(serverHosts).where(eq(serverHosts.id, Number(id))).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Host not found' }, { status: 404 });
  }
  return NextResponse.json({ host: sanitizeHost(rows[0]) });
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const hostId = Number(id);
  const existing = await db.select().from(serverHosts).where(eq(serverHosts.id, hostId)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Host not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const publicAddress = String(body.publicAddress || '').trim();
    const sshHost = String(body.sshHost || '').trim();
    const sshPort = Number(body.sshPort || 22);
    const sshUsername = String(body.sshUsername || '').trim();
    const privateKey = String(body.privateKey || '').trim();
    const baseDeployPath = String(body.baseDeployPath || '~/game-servers').trim();
    const portRangeStart = Number(body.portRangeStart);
    const portRangeEnd = Number(body.portRangeEnd);
    const maxInstances = Number(body.maxInstances || 5);
    const enabled = body.enabled !== false ? 1 : 0;

    if (!name || !publicAddress || !sshHost || !sshUsername) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }
    if (!Number.isInteger(portRangeStart) || !Number.isInteger(portRangeEnd) || portRangeStart >= portRangeEnd) {
      return NextResponse.json({ error: 'Port range is invalid' }, { status: 400 });
    }

    await db.update(serverHosts).set({
      name,
      publicAddress,
      sshHost,
      sshPort,
      sshUsername,
      encryptedPrivateKey: privateKey ? encryptSecret(privateKey) : existing[0].encryptedPrivateKey,
      baseDeployPath,
      portRangeStart,
      portRangeEnd,
      maxInstances,
      enabled,
      healthStatus: 'pending_validation',
      lastCheckedAt: null,
    }).where(eq(serverHosts.id, hostId));
    const validationJob = await queueValidationSafely(hostId);

    return NextResponse.json({ success: true, validationJob });
  } catch (error: any) {
    logServerHostWriteError('updating', error);
    if (isDuplicateHostError(error)) {
      return NextResponse.json(
        { error: 'A server host with this SSH host and port already exists' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to update host' }, { status: 400 });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const hostId = Number(id);
  const instances = await db
    .select({ id: gameServerInstances.id })
    .from(gameServerInstances)
    .where(eq(gameServerInstances.hostId, hostId))
    .limit(1);

  if (instances.length > 0) {
    return NextResponse.json({ error: 'Cannot delete host with server instances' }, { status: 400 });
  }

  await db.delete(serverHosts).where(eq(serverHosts.id, hostId));
  return NextResponse.json({ success: true });
});
