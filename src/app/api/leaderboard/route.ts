import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { matchzyStatsPlayers } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const topKillersQuery = sql`
      SELECT 
        steamid64,
        name,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(damage) as total_damage,
        SUM(head_shot_kills) as total_headshots,
        COUNT(DISTINCT matchid) as matches_played
      FROM ${matchzyStatsPlayers}
      GROUP BY steamid64, name
      ORDER BY total_kills DESC
      LIMIT 10
    `;

    const topDamageQuery = sql`
      SELECT 
        steamid64,
        name,
        SUM(damage) as total_damage,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(head_shot_kills) as total_headshots,
        COUNT(DISTINCT matchid) as matches_played
      FROM ${matchzyStatsPlayers}
      GROUP BY steamid64, name
      ORDER BY total_damage DESC
      LIMIT 10
    `;

    const topHeadshotQuery = sql`
      SELECT 
        steamid64,
        name,
        SUM(head_shot_kills) as total_headshots,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(damage) as total_damage,
        COUNT(DISTINCT matchid) as matches_played,
        ROUND((SUM(head_shot_kills) * 100.0 / NULLIF(SUM(kills), 0)), 2) as headshot_percentage
      FROM ${matchzyStatsPlayers}
      GROUP BY steamid64, name
      HAVING total_kills > 0
      ORDER BY total_headshots DESC
      LIMIT 10
    `;

    const [topKillers, topDamage, topHeadshot] = await Promise.all([
      db.execute(topKillersQuery),
      db.execute(topDamageQuery),
      db.execute(topHeadshotQuery),
    ]);

    return NextResponse.json({
      topKillers: topKillers[0],
      topDamage: topDamage[0],
      topHeadshot: topHeadshot[0],
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

