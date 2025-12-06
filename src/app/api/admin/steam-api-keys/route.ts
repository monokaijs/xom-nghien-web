import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { steamApiKeys, tempGameServers } from '@/lib/db/schema';
import { eq, sql, and, gt, isNull } from 'drizzle-orm';

export const GET = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    let query = sql`
      SELECT
        sak.id,
        sak.name,
        sak.steam_account,
        sak.is_active,
        sak.created_at,
        sak.updated_at,
        (SELECT COUNT(*) FROM temp_game_servers tgs
         WHERE tgs.steam_api_key_id = sak.id
         AND tgs.expires_at > NOW()) as active_servers
      FROM steam_api_keys sak
    `;

    if (search) {
      query = sql`${query} WHERE (sak.name LIKE ${`%${search}%`} OR sak.steam_account LIKE ${`%${search}%`})`;
    }

    query = sql`${query} ORDER BY sak.created_at DESC`;

    const result = await db.execute(query);
    const keysList = (result[0] as unknown) as any[];

    return NextResponse.json({ steamApiKeys: keysList });
  } catch (error) {
    console.error('Error fetching Steam API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch Steam API keys' }, { status: 500 });
  }
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, steamAccount, isActive } = body;

    if (!name || !steamAccount) {
      return NextResponse.json(
        { error: 'Name and GSLT are required' },
        { status: 400 }
      );
    }

    const result = await db.insert(steamApiKeys).values({
      name,
      steamAccount,
      isActive: isActive !== false ? 1 : 0,
    });

    return NextResponse.json({
      success: true,
      keyId: result[0].insertId
    });
  } catch (error: any) {
    console.error('Error creating Steam API key:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'This GSLT already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create Steam API key' }, { status: 500 });
  }
});

