import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { executeQuery } from '@/lib/database';
import { UserSkinConfig } from '@/types/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSkins = await executeQuery(
      'SELECT * FROM wp_player_skins WHERE steamid = ? ORDER BY weapon_team, weapon_defindex',
      [session.user.steamid]
    ) as UserSkinConfig[];

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
