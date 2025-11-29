import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/auth';
import { db } from '@/lib/database';
import { userInfo } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const GET = requireModerator(async (request: NextRequest, currentUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = sql`
      SELECT
        steamid64,
        name,
        avatar,
        avatarfull,
        role,
        banned,
        last_updated
      FROM ${userInfo}
    `;

    if (search) {
      query = sql`
        SELECT
          steamid64,
          name,
          avatar,
          avatarfull,
          role,
          banned,
          last_updated
        FROM ${userInfo}
        WHERE name LIKE ${`%${search}%`} OR steamid64 LIKE ${`%${search}%`}
      `;
    }

    query = sql`${query} ORDER BY COALESCE(last_updated, '1970-01-01') DESC, steamid64 ASC LIMIT ${limit} OFFSET ${offset}`;

    const result = await db.execute(query);
    const users = (result[0] as unknown) as any[];

    const countQuery = search
      ? sql`SELECT COUNT(*) as total FROM ${userInfo} WHERE name LIKE ${`%${search}%`} OR steamid64 LIKE ${`%${search}%`}`
      : sql`SELECT COUNT(*) as total FROM ${userInfo}`;

    const countResult = await db.execute(countQuery);
    const total = ((countResult[0] as unknown) as any[])[0]?.total || 0;

    return NextResponse.json({
      users: users.map(user => ({
        steamid64: user.steamid64,
        name: user.name,
        avatar: user.avatar,
        avatarfull: user.avatarfull,
        role: user.role || 'user',
        banned: user.banned === 1,
        lastUpdated: user.last_updated,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});

