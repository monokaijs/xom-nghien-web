import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, like, or } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameCredentials } from '@xom/db';
import { encryptSecret } from '@xom/db/crypto';

function sanitizeCredential(credential: typeof gameCredentials.$inferSelect) {
  const { encryptedValue, ...safeCredential } = credential;
  return safeCredential;
}

export const GET = requireAdmin(async (request: NextRequest) => {
  const search = new URL(request.url).searchParams.get('search') || '';
  const rows = await db
    .select()
    .from(gameCredentials)
    .where(search ? or(
      like(gameCredentials.name, `%${search}%`),
      like(gameCredentials.gameKey, `%${search}%`),
      like(gameCredentials.type, `%${search}%`),
    ) : undefined)
    .orderBy(desc(gameCredentials.created_at));

  return NextResponse.json({ credentials: rows.map(sanitizeCredential) });
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const gameKey = String(body.gameKey || 'cs2').trim();
    const type = String(body.type || 'gslt').trim();
    const name = String(body.name || '').trim();
    const value = String(body.value || '').trim();
    const isActive = body.isActive !== false ? 1 : 0;

    if (gameKey !== 'cs2' || type !== 'gslt') {
      return NextResponse.json({ error: 'Only CS2 GSLT credentials are supported in v1' }, { status: 400 });
    }
    if (!name || !value) {
      return NextResponse.json({ error: 'Name and credential value are required' }, { status: 400 });
    }

    const result = await db.insert(gameCredentials).values({
      gameKey,
      type,
      name,
      encryptedValue: encryptSecret(value),
      isActive,
    });

    return NextResponse.json({ success: true, credentialId: result[0].insertId });
  } catch (error: any) {
    console.error('Error creating game credential:', error);
    return NextResponse.json({ error: error.message || 'Failed to create credential' }, { status: 400 });
  }
});
