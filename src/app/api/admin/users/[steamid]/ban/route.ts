import { NextRequest, NextResponse } from 'next/server';
import { requireModerator, canManageUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { userInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = requireModerator(async (request: NextRequest, currentUser, { params }: any) => {
  try {
    const { steamid } = await params;
    const body = await request.json();
    const { banned } = body;

    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'Invalid banned value' }, { status: 400 });
    }

    const targetUserResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, steamid))
      .limit(1);

    if (targetUserResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetUserResult[0];
    const targetRole = (targetUser.role || 'user') as 'admin' | 'moderator' | 'user';

    if (!canManageUser(currentUser, targetRole)) {
      return NextResponse.json(
        { error: 'Cannot ban users with admin or moderator roles' },
        { status: 403 }
      );
    }

    await db
      .update(userInfo)
      .set({ banned: banned ? 1 : 0 })
      .where(eq(userInfo.steamid64, steamid));

    return NextResponse.json({
      success: true,
      message: banned ? 'User banned successfully' : 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Error banning/unbanning user:', error);
    return NextResponse.json(
      { error: 'Failed to update user ban status' },
      { status: 500 }
    );
  }
});

