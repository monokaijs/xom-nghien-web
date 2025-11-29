import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { userInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const VALID_ROLES = ['admin', 'moderator', 'user'];

export const PUT = requireAdmin(async (request: NextRequest, currentUser, { params }: any) => {
  try {
    const { steamid } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, moderator, user' },
        { status: 400 }
      );
    }

    const targetUserResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, steamid))
      .limit(1);

    if (targetUserResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db
      .update(userInfo)
      .set({ role })
      .where(eq(userInfo.steamid64, steamid));

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      role,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
});

