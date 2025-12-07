import { db } from '@/lib/database';
import { matchzyStatsPlayers, matchzyStatsMaps } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { fetchAndCacheMultipleUsers } from '@/lib/steam-api';

export async function getLeaderboard(timeframe: 'all' | 'weekly' = 'all') {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 19).replace('T', ' ');

    const timeFilter = timeframe === 'weekly'
      ? sql`AND EXISTS (
          SELECT 1 FROM matchzy_stats_maps m
          WHERE m.matchid = p.matchid
          AND m.mapnumber = p.mapnumber
          AND m.start_time >= ${weekAgoStr}
        )`
      : sql``;

    const topKillersQuery = sql`
      SELECT
        p.steamid64,
        p.name,
        SUM(p.kills) as total_kills,
        SUM(p.deaths) as total_deaths,
        SUM(p.damage) as total_damage,
        SUM(p.head_shot_kills) as total_headshots,
        COUNT(DISTINCT p.matchid) as matches_played
      FROM ${matchzyStatsPlayers} p
      WHERE 1=1 ${timeFilter}
      GROUP BY p.steamid64, p.name
      ORDER BY total_kills DESC
      LIMIT 10
    `;

    const topDamageQuery = sql`
      SELECT
        p.steamid64,
        p.name,
        SUM(p.damage) as total_damage,
        SUM(p.kills) as total_kills,
        SUM(p.deaths) as total_deaths,
        SUM(p.head_shot_kills) as total_headshots,
        COUNT(DISTINCT p.matchid) as matches_played
      FROM ${matchzyStatsPlayers} p
      WHERE 1=1 ${timeFilter}
      GROUP BY p.steamid64, p.name
      ORDER BY total_damage DESC
      LIMIT 10
    `;

    const topHeadshotQuery = sql`
      SELECT
        p.steamid64,
        p.name,
        SUM(p.head_shot_kills) as total_headshots,
        SUM(p.kills) as total_kills,
        SUM(p.deaths) as total_deaths,
        SUM(p.damage) as total_damage,
        COUNT(DISTINCT p.matchid) as matches_played,
        ROUND((SUM(p.head_shot_kills) * 100.0 / NULLIF(SUM(p.kills), 0)), 2) as headshot_percentage
      FROM ${matchzyStatsPlayers} p
      WHERE 1=1 ${timeFilter}
      GROUP BY p.steamid64, p.name
      HAVING total_kills > 0
      ORDER BY total_headshots DESC
      LIMIT 10
    `;

    const topKDAQuery = sql`
      SELECT
        p.steamid64,
        p.name,
        SUM(p.kills) as total_kills,
        SUM(p.deaths) as total_deaths,
        SUM(p.assists) as total_assists,
        SUM(p.damage) as total_damage,
        SUM(p.head_shot_kills) as total_headshots,
        COUNT(DISTINCT p.matchid) as matches_played,
        ROUND((SUM(p.kills) + SUM(p.assists)) / NULLIF(SUM(p.deaths), 0), 2) as kda_ratio
      FROM ${matchzyStatsPlayers} p
      WHERE 1=1 ${timeFilter}
      GROUP BY p.steamid64, p.name
      HAVING total_deaths > 0
      ORDER BY kda_ratio DESC
      LIMIT 10
    `;

    const [topKillers, topDamage, topHeadshot, topKDA] = await Promise.all([
      db.execute(topKillersQuery),
      db.execute(topDamageQuery),
      db.execute(topHeadshotQuery),
      db.execute(topKDAQuery),
    ]);

    const allSteamIds = new Set<string>();
    (topKillers[0] as unknown as any[]).forEach((player: any) => allSteamIds.add(player.steamid64));
    (topDamage[0] as unknown as any[]).forEach((player: any) => allSteamIds.add(player.steamid64));
    (topHeadshot[0] as unknown as any[]).forEach((player: any) => allSteamIds.add(player.steamid64));
    (topKDA[0] as unknown as any[]).forEach((player: any) => allSteamIds.add(player.steamid64));

    const steamUserData = await fetchAndCacheMultipleUsers(Array.from(allSteamIds));

    const enrichPlayers = (players: any[]) => {
      return players.map((player: any) => {
        const steamData = steamUserData.get(player.steamid64);
        return {
          ...player,
          avatar: steamData?.avatarfull || steamData?.avatarmedium || steamData?.avatar,
        };
      });
    };

    return {
      topKillers: enrichPlayers(topKillers[0] as unknown as any[]),
      topDamage: enrichPlayers(topDamage[0] as unknown as any[]),
      topHeadshot: enrichPlayers(topHeadshot[0] as unknown as any[]),
      topKDA: enrichPlayers(topKDA[0] as unknown as any[]),
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      topKillers: [],
      topDamage: [],
      topHeadshot: [],
      topKDA: [],
    };
  }
}

