import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { matchzyStatsPlayers, matchzyStatsMatches, matchzyStatsMaps, userInfo } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamid64: string }> }
) {
  try {
    const { steamid64 } = await params;

    const playerStatsQuery = sql`
      SELECT 
        steamid64,
        name,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(damage) as total_damage,
        SUM(assists) as total_assists,
        SUM(head_shot_kills) as total_headshots,
        SUM(enemy5ks) as total_5ks,
        SUM(enemy4ks) as total_4ks,
        SUM(enemy3ks) as total_3ks,
        SUM(enemy2ks) as total_2ks,
        SUM(v1_wins) as total_1v1_wins,
        SUM(v1_count) as total_1v1_count,
        SUM(v2_wins) as total_1v2_wins,
        SUM(v2_count) as total_1v2_count,
        SUM(entry_wins) as total_entry_wins,
        SUM(entry_count) as total_entry_count,
        SUM(utility_damage) as total_utility_damage,
        SUM(flash_successes) as total_flash_successes,
        SUM(enemies_flashed) as total_enemies_flashed,
        COUNT(DISTINCT matchid) as matches_played,
        ROUND((SUM(head_shot_kills) * 100.0 / NULLIF(SUM(kills), 0)), 2) as headshot_percentage,
        ROUND((SUM(kills) * 1.0 / NULLIF(SUM(deaths), 0)), 2) as kd_ratio,
        ROUND((SUM(kills) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_kills_per_match,
        ROUND((SUM(deaths) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_deaths_per_match,
        ROUND((SUM(damage) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_damage_per_match
      FROM ${matchzyStatsPlayers}
      WHERE steamid64 = ${steamid64}
      GROUP BY steamid64, name
    `;

    const playerStatsResult = await db.execute(playerStatsQuery);
    const playerStats = (playerStatsResult[0] as unknown as any[])[0];

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const matchHistoryQuery = sql`
      SELECT 
        m.matchid,
        m.start_time,
        m.end_time,
        m.winner,
        m.series_type,
        m.team1_name,
        m.team1_score,
        m.team2_name,
        m.team2_score,
        p.team,
        p.kills,
        p.deaths,
        p.damage,
        p.assists,
        p.head_shot_kills,
        mp.mapname
      FROM ${matchzyStatsPlayers} p
      JOIN ${matchzyStatsMatches} m ON p.matchid = m.matchid
      JOIN ${matchzyStatsMaps} mp ON p.matchid = mp.matchid AND p.mapnumber = mp.mapnumber
      WHERE p.steamid64 = ${steamid64}
      ORDER BY m.start_time DESC
      LIMIT 20
    `;

    const matchHistoryResult = await db.execute(matchHistoryQuery);
    const matchHistory = matchHistoryResult[0];

    const userInfoResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, steamid64))
      .limit(1);

    const profile = userInfoResult[0] || null;

    return NextResponse.json({
      stats: playerStats,
      matchHistory,
      profile,
    });
  } catch (error) {
    console.error('Error fetching player data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}

