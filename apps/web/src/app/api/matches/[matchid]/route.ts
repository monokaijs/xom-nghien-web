import { NextRequest, NextResponse } from 'next/server';
import { db } from '@xom/db';
import { matchzyDemos, matchzyStatsMatches, matchzyStatsMaps, matchzyStatsPlayers, xnRatingLedger, xnRatings } from '@xom/db';
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
        m.mapname,
        xr.rating AS xn_rating,
        xl.rating_delta,
        xl.rating_after
      FROM ${matchzyStatsPlayers} p
      JOIN ${matchzyStatsMaps} m ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
      LEFT JOIN ${xnRatings} xr ON xr.steamid64 = CAST(p.steamid64 AS CHAR)
      LEFT JOIN ${xnRatingLedger} xl ON xl.matchid = p.matchid AND xl.steamid64 = CAST(p.steamid64 AS CHAR)
      WHERE p.matchid = ${matchId}
      ORDER BY p.mapnumber, p.kills DESC
    `;

    const demosQuery = sql`
      SELECT id, matchid, mapnumber, file_name, file_size, sha256, uploaded_at,
             parse_status, parser_version, parsed_at, parse_error
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
