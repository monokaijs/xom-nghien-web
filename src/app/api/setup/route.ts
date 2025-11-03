import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wp_player_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        steamid VARCHAR(64) NOT NULL,
        weapon_defindex INT NOT NULL,
        weapon_paint_id VARCHAR(64) NOT NULL,
        weapon_wear FLOAT DEFAULT 0.0,
        weapon_seed INT DEFAULT 0,
        weapon_nametag VARCHAR(255) DEFAULT '',
        weapon_stattrak TINYINT(1) DEFAULT 0,
        weapon_sticker_0 TEXT,
        weapon_sticker_1 TEXT,
        weapon_sticker_2 TEXT,
        weapon_sticker_3 TEXT,
        weapon_sticker_4 TEXT,
        weapon_keychain TEXT,
        equipped_ct TINYINT(1) DEFAULT 0,
        equipped_t TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_skin (steamid, weapon_defindex, weapon_paint_id),
        INDEX idx_steamid (steamid),
        INDEX idx_equipped (equipped_ct, equipped_t)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'Inventory table created successfully'
    });
  } catch (error) {
    console.error('Error creating inventory table:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create inventory table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'wp_player_inventory'
    `);
    const tableExists = (result[0] as any)?.count > 0;

    return NextResponse.json({
      tableExists,
      message: tableExists
        ? 'Inventory table already exists'
        : 'Inventory table does not exist. Run POST to create it.'
    });
  } catch (error) {
    console.error('Error checking inventory table:', error);
    return NextResponse.json(
      { error: 'Failed to check inventory table' },
      { status: 500 }
    );
  }
}

