import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers, userInfo } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const tournamentResult = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (tournamentResult.length === 0) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const tournament = tournamentResult[0];

    const playersQuery = sql`
      SELECT
        tp.id,
        tp.tournament_id,
        tp.team_number,
        tp.steamid64,
        tp.player_name,
        ui.avatar,
        ui.avatarmedium,
        ui.avatarfull
      FROM ${tournamentPlayers} tp
      LEFT JOIN ${userInfo} ui ON tp.steamid64 = ui.steamid64
      WHERE tp.tournament_id = ${tournamentId}
      ORDER BY tp.team_number, tp.id
    `;

    const playersResult = await db.execute(playersQuery);
    const playersData = playersResult[0] as unknown as any[];

    return NextResponse.json({
      tournament,
      players: playersData,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

