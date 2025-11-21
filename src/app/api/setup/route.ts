import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_info (
        steamid64 VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(512),
        avatarmedium VARCHAR(512),
        avatarfull VARCHAR(512),
        profileurl VARCHAR(512),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_last_updated (last_updated)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'Tables created successfully'
    });
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userInfoResult = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'user_info'
    `);
    const userInfoTableExists = (userInfoResult[0] as any)?.count > 0;

    return NextResponse.json({
      userInfoTableExists,
      message: userInfoTableExists
        ? 'All tables already exist'
        : 'Some tables do not exist. Run POST to create them.'
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { error: 'Failed to check tables' },
      { status: 500 }
    );
  }
}

