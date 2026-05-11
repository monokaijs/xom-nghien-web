import { NextRequest, NextResponse } from 'next/server';
import { eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameCredentials } from '@xom/db';
import { encryptSecret } from '@xom/db/crypto';

function sanitizeCredential(credential: typeof gameCredentials.$inferSelect) {
  const { encryptedValue, ...safeCredential } = credential;
  return safeCredential;
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const rows = await db.select().from(gameCredentials).where(eq(gameCredentials.id, Number(id))).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }
  return NextResponse.json({ credential: sanitizeCredential(rows[0]) });
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const credentialId = Number(id);
  const existing = await db.select().from(gameCredentials).where(eq(gameCredentials.id, credentialId)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name || '').trim();
  const value = String(body.value || '').trim();
  const isActive = body.isActive !== false ? 1 : 0;
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  await db.update(gameCredentials).set({
    name,
    isActive,
    encryptedValue: value ? encryptSecret(value) : existing[0].encryptedValue,
  }).where(eq(gameCredentials.id, credentialId));

  return NextResponse.json({ success: true });
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const credentialId = Number(id);
  const rows = await db.select().from(gameCredentials).where(eq(gameCredentials.id, credentialId)).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }
  if (rows[0].assignedInstanceId) {
    return NextResponse.json({ error: 'Credential is assigned to a server instance' }, { status: 400 });
  }

  await db.delete(gameCredentials).where(eq(gameCredentials.id, credentialId));
  return NextResponse.json({ success: true });
});
