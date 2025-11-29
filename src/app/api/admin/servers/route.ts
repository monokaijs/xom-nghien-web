import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { servers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const game = searchParams.get('game') || '';

  try {
    let query = sql`SELECT * FROM ${servers}`;
    const conditions = [];

    if (search) {
      conditions.push(sql`(name LIKE ${`%${search}%`} OR address LIKE ${`%${search}%`})`);
    }

    if (game) {
      conditions.push(sql`game = ${game}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const result = await db.execute(query);
    const serverList = (result[0] as unknown) as any[];

    return NextResponse.json({ servers: serverList });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
  }
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, game, address, description, rcon_password } = body;

    if (!name || !game || !address) {
      return NextResponse.json(
        { error: 'Name, game, and address are required' },
        { status: 400 }
      );
    }

    const result = await db.insert(servers).values({
      name,
      game,
      address,
      description: description || null,
      rcon_password: rcon_password || null,
    });

    return NextResponse.json({
      success: true,
      serverId: result[0].insertId
    });
  } catch (error: any) {
    console.error('Error creating server:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A server with this address already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 });
  }
});

