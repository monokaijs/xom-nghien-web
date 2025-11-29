import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { matchzyStatsMatches, matchzyStatsMaps, matchzyStatsPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE = requireAdmin(async (request: NextRequest, currentUser, { params }: any) => {
  try {
    const { matchid } = await params;
    const matchId = parseInt(matchid);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const matchResult = await db
      .select()
      .from(matchzyStatsMatches)
      .where(eq(matchzyStatsMatches.matchid, matchId))
      .limit(1);

    if (matchResult.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    await db.delete(matchzyStatsPlayers).where(eq(matchzyStatsPlayers.matchid, matchId));
    await db.delete(matchzyStatsMaps).where(eq(matchzyStatsMaps.matchid, matchId));
    await db.delete(matchzyStatsMatches).where(eq(matchzyStatsMatches.matchid, matchId));

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
});

