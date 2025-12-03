import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const playersResult = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournament_id, tournamentId));

    return NextResponse.json({
      tournament,
      players: playersResult,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

