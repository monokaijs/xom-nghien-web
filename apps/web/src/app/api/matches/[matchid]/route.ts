import { NextRequest, NextResponse } from 'next/server';
import { db } from '@xom/db';
import { matchzyDemos, matchzyStatsMatches, matchzyStatsMaps, matchzyStatsPlayers } from '@xom/db';
import { sql } from '@xom/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchid: string }> }
) {
  try {
    const { matchid } = await params;
    const matchId = parseInt(matchid);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const matchQuery = sql`
      SELECT * FROM ${matchzyStatsMatches}
      WHERE matchid = ${matchId}
    `;

    const matchResult = await db.execute(matchQuery);
    const match = (matchResult[0] as unknown as any[])[0];

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const mapsQuery = sql`
      SELECT * FROM ${matchzyStatsMaps}
      WHERE matchid = ${matchId}
      ORDER BY mapnumber ASC
    `;

    const playersQuery = sql`
      SELECT 
        p.*,
        m.mapname
      FROM ${matchzyStatsPlayers} p
      JOIN ${matchzyStatsMaps} m ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
      WHERE p.matchid = ${matchId}
      ORDER BY p.mapnumber, p.kills DESC
    `;

    const demosQuery = sql`
      SELECT matchid, mapnumber, file_name, file_size, sha256, uploaded_at
      FROM ${matchzyDemos}
      WHERE matchid = ${matchId}
      ORDER BY mapnumber ASC
    `;

    const [mapsResult, playersResult, demosResult] = await Promise.all([
      db.execute(mapsQuery),
      db.execute(playersQuery),
      db.execute(demosQuery),
    ]);

    return NextResponse.json({
      match,
      maps: mapsResult[0],
      players: playersResult[0],
      demos: demosResult[0],
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}
