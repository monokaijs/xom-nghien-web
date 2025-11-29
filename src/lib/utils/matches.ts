import { db } from '@/lib/database';
import { matchzyStatsMatches, matchzyStatsMaps, matchzyStatsPlayers } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function getMatches(limit: number = 10, offset: number = 0) {
  try {
    const matchesQuery = sql`
      SELECT
        m.*,
        COUNT(DISTINCT mp.mapnumber) as maps_played
      FROM ${matchzyStatsMatches} m
      LEFT JOIN ${matchzyStatsMaps} mp ON m.matchid = mp.matchid
      WHERE NOT (m.team1_score = 0 AND m.team2_score = 0)
      GROUP BY m.matchid
      ORDER BY m.start_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const matches = await db.execute(matchesQuery);

    const matchesWithDetails = await Promise.all(
      (matches[0] as unknown as any[]).map(async (match) => {
        const mapsQuery = sql`
          SELECT * FROM ${matchzyStatsMaps}
          WHERE matchid = ${match.matchid}
          ORDER BY mapnumber ASC
        `;

        const playersQuery = sql`
          SELECT 
            p.*,
            m.mapname
          FROM ${matchzyStatsPlayers} p
          JOIN ${matchzyStatsMaps} m ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
          WHERE p.matchid = ${match.matchid}
          ORDER BY p.mapnumber, p.kills DESC
        `;

        const [maps, players] = await Promise.all([
          db.execute(mapsQuery),
          db.execute(playersQuery),
        ]);

        return {
          ...match,
          maps: maps[0],
          players: players[0],
        };
      })
    );

    const countQuery = sql`SELECT COUNT(*) as total FROM ${matchzyStatsMatches} WHERE NOT (team1_score = 0 AND team2_score = 0)`;
    const countResult = await db.execute(countQuery);
    const total = (countResult[0] as unknown as any[])[0]?.total || 0;

    return {
      matches: matchesWithDetails,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return {
      matches: [],
      total: 0,
      limit,
      offset,
    };
  }
}

