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

    const [matchesResult, countResult] = await Promise.all([
      db.execute(matchesQuery),
      db.execute(sql`SELECT COUNT(*) as total FROM ${matchzyStatsMatches} WHERE NOT (team1_score = 0 AND team2_score = 0)`),
    ]);

    const matchesList = matchesResult[0] as unknown as any[];
    const total = (countResult[0] as unknown as any[])[0]?.total || 0;

    if (matchesList.length === 0) {
      return { matches: [], total, limit, offset };
    }

    // Batch fetch all maps and players for all matches in 2 queries instead of 2*N
    const matchIds = matchesList.map(m => m.matchid);
    const matchIdsPlaceholder = sql.join(matchIds.map(id => sql`${id}`), sql`, `);

    const [allMapsResult, allPlayersResult] = await Promise.all([
      db.execute(sql`
        SELECT * FROM ${matchzyStatsMaps}
        WHERE matchid IN (${matchIdsPlaceholder})
        ORDER BY matchid, mapnumber ASC
      `),
      db.execute(sql`
        SELECT
          p.*,
          m.mapname
        FROM ${matchzyStatsPlayers} p
        JOIN ${matchzyStatsMaps} m ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
        WHERE p.matchid IN (${matchIdsPlaceholder})
        ORDER BY p.matchid, p.mapnumber, p.kills DESC
      `),
    ]);

    const allMaps = allMapsResult[0] as unknown as any[];
    const allPlayers = allPlayersResult[0] as unknown as any[];

    // Group maps and players by matchid
    const mapsByMatchId = new Map<number, any[]>();
    const playersByMatchId = new Map<number, any[]>();

    for (const map of allMaps) {
      if (!mapsByMatchId.has(map.matchid)) {
        mapsByMatchId.set(map.matchid, []);
      }
      mapsByMatchId.get(map.matchid)!.push(map);
    }

    for (const player of allPlayers) {
      if (!playersByMatchId.has(player.matchid)) {
        playersByMatchId.set(player.matchid, []);
      }
      playersByMatchId.get(player.matchid)!.push(player);
    }

    const matchesWithDetails = matchesList.map(match => ({
      ...match,
      maps: mapsByMatchId.get(match.matchid) || [],
      players: playersByMatchId.get(match.matchid) || [],
    }));

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

