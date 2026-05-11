import { NextRequest, NextResponse } from 'next/server';
import { desc, like, or } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { serverHosts } from '@xom/db';
import { encryptSecret } from '@xom/db/crypto';
import { queueHostValidation } from '@/lib/server-management/queue';

function sanitizeHost(host: typeof serverHosts.$inferSelect) {
  const { encryptedPrivateKey, ...safeHost } = host;
  return safeHost;
}

function readBody(body: any) {
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

  if (!name || !publicAddress || !sshHost || !sshUsername || !privateKey) {
    throw new Error('Name, public address, SSH host, username, and private key are required');
  }
  if (!Number.isInteger(sshPort) || sshPort <= 0) {
    throw new Error('SSH port is invalid');
  }
  if (!Number.isInteger(portRangeStart) || !Number.isInteger(portRangeEnd) || portRangeStart >= portRangeEnd) {
    throw new Error('Port range is invalid');
  }
  if (!Number.isInteger(maxInstances) || maxInstances <= 0) {
    throw new Error('Max instances is invalid');
  }

  return {
    name,
    publicAddress,
    sshHost,
    sshPort,
    sshUsername,
    privateKey,
    baseDeployPath,
    portRangeStart,
    portRangeEnd,
    maxInstances,
    enabled,
  };
}

export const GET = requireAdmin(async (request: NextRequest) => {
  const search = new URL(request.url).searchParams.get('search') || '';

  const rows = await db
    .select()
    .from(serverHosts)
    .where(search ? or(
      like(serverHosts.name, `%${search}%`),
      like(serverHosts.publicAddress, `%${search}%`),
      like(serverHosts.sshHost, `%${search}%`),
    ) : undefined)
    .orderBy(desc(serverHosts.created_at));

  return NextResponse.json({ hosts: rows.map(sanitizeHost) });
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = readBody(await request.json());
    const result = await db.insert(serverHosts).values({
      name: body.name,
      publicAddress: body.publicAddress,
      sshHost: body.sshHost,
      sshPort: body.sshPort,
      sshUsername: body.sshUsername,
      encryptedPrivateKey: encryptSecret(body.privateKey),
      baseDeployPath: body.baseDeployPath,
      portRangeStart: body.portRangeStart,
      portRangeEnd: body.portRangeEnd,
      maxInstances: body.maxInstances,
      enabled: body.enabled,
      healthStatus: 'pending_validation',
      lastCheckedAt: null,
    });
    const hostId = result[0].insertId;
    const validationJob = await queueHostValidation(hostId);

    return NextResponse.json({ success: true, hostId, validationJob });
  } catch (error: any) {
    console.error('Error creating server host:', error);
    return NextResponse.json({ error: error.message || 'Failed to create server host' }, { status: 400 });
  }
});
