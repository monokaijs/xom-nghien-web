import { NextRequest, NextResponse } from 'next/server';
import { tournaments } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import {db} from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = sql`
      SELECT * FROM ${tournaments}
      WHERE 1=1
    `;

    if (search) {
      query = sql`
        SELECT * FROM ${tournaments}
        WHERE team1_name LIKE ${`%${search}%`}
        OR team2_name LIKE ${`%${search}%`}
      `;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const result = await db.execute(query);
    const tournamentList = result[0] as unknown as any[];

    return NextResponse.json({
      tournaments: tournamentList,
      total: tournamentList.length,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

