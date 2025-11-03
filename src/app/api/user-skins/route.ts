import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/database';
import { playerSkins } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { UserSkinConfig } from '@/types/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSkins = await db
      .select()
      .from(playerSkins)
      .where(eq(playerSkins.steamid, session.user.steamid))
      .orderBy(asc(playerSkins.weapon_team), asc(playerSkins.weapon_defindex)) as UserSkinConfig[];

    return NextResponse.json({
      skins: userSkins,
      total: userSkins.length,
    });
  } catch (error) {
    console.error('Error fetching user skins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user skins' },
      { status: 500 }
    );
  }
}

// This endpoint is deprecated in favor of /api/apply-skin
// Keeping for backward compatibility
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/apply-skin instead.' },
    { status: 410 }
  );
}
