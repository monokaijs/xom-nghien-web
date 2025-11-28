import React from 'react';
import {notFound} from 'next/navigation';
import { IconArrowLeft, IconBrandSteam, IconBrandFacebook, IconBrandSpotify, IconBrandTwitter, IconBrandInstagram, IconBrandGithub } from '@tabler/icons-react';
import PlayerInventory from '@/components/PlayerInventory';
import {db} from '@/lib/database';
import {matchzyStatsPlayers, matchzyStatsMatches, matchzyStatsMaps, userInfo} from '@/lib/db/schema';
import {sql, eq} from 'drizzle-orm';
import Link from 'next/link';
import PlayerTabs from './PlayerTabs';
import {INVENTORY_SERVICE_URL} from '@/config/app';

interface PlayerData {
  stats: any;
  matchHistory: any[];
  profile: any;
  inventory: any;
}

async function getPlayerData(steamId: string): Promise<PlayerData | null> {
  try {
    const playerStatsQuery = sql`
      SELECT
        steamid64,
        name,
        COUNT(DISTINCT matchid) as matches_played,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(assists) as total_assists,
        SUM(damage) as total_damage,
        SUM(head_shot_kills) as total_headshots,
        SUM(enemy5ks) as total_5ks,
        SUM(enemy4ks) as total_4ks,
        SUM(enemy3ks) as total_3ks,
        SUM(v1_count) as total_v1_count,
        SUM(v1_wins) as total_v1_wins,
        SUM(entry_count) as total_entry_count,
        SUM(entry_wins) as total_entry_wins,
        ROUND((SUM(head_shot_kills) * 100.0 / NULLIF(SUM(kills), 0)), 2) as headshot_percentage,
        ROUND((SUM(kills) * 1.0 / NULLIF(SUM(deaths), 0)), 2) as kd_ratio,
        ROUND((SUM(kills) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_kills_per_match,
        ROUND((SUM(deaths) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_deaths_per_match,
        ROUND((SUM(damage) * 1.0 / NULLIF(COUNT(DISTINCT matchid), 0)), 2) as avg_damage_per_match
      FROM ${matchzyStatsPlayers}
      WHERE steamid64 = ${steamId}
      GROUP BY steamid64, name
    `;

    const playerStatsResult = await db.execute(playerStatsQuery);
    const playerStats = (playerStatsResult[0] as unknown as any[])[0];

    if (!playerStats) {
      return null;
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
      WHERE p.steamid64 = ${steamId}
      ORDER BY m.start_time DESC
      LIMIT 20
    `;

    const matchHistoryResult = await db.execute(matchHistoryQuery);
    const matchHistory = matchHistoryResult[0];

    const userInfoResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, steamId))
      .limit(1);

    const profile = userInfoResult.length > 0 ? userInfoResult[0] : null;

    let inventory = null;
    try {
      const inventoryUrl = `${INVENTORY_SERVICE_URL}/api/inventory/${steamId}.json`;
      const inventoryResponse = await fetch(inventoryUrl, {
        next: { revalidate: 60 }
      });
      if (inventoryResponse.ok) {
        inventory = await inventoryResponse.json();
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }

    return {
      stats: playerStats as any,
      matchHistory: matchHistory as any,
      profile: profile as any,
      inventory: inventory,
    };
  } catch (error) {
    console.error('Error fetching player data:', error);
    return null;
  }
}

export default async function PlayerProfilePage({params}: {params: Promise<{steamId: string}>}) {
  const {steamId} = await params;
  const data = await getPlayerData(steamId);

  if (!data) {
    notFound();
  }

  const stats = data.stats;
  const profile = data.profile;
  const avatar = profile?.avatarfull || profile?.avatarmedium || profile?.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit"
      >
        <IconArrowLeft size={20} />
        <span>Quay Lại</span>
      </Link>

      <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
        <div className="flex items-stretch gap-6 max-md:flex-col">
          <img
            src={avatar}
            alt={stats.name}
            className="w-32 h-32 rounded-2xl object-cover"
          />
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{stats.name}</h1>
            <div className="flex items-center gap-4 text-sm text-white/70 mb-2">
              <span>{stats.matches_played} Trận Đã Chơi</span>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={profile?.profileurl || `https://steamcommunity.com/profiles/${steamId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-accent-primary transition-colors"
                title="Steam Profile"
              >
                <IconBrandSteam size={24} />
              </a>
              {profile?.facebook && (
                <a
                  href={profile.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1877F2] transition-colors"
                  title="Facebook"
                >
                  <IconBrandFacebook size={24} />
                </a>
              )}
              {profile?.spotify && (
                <a
                  href={profile.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1DB954] transition-colors"
                  title="Spotify"
                >
                  <IconBrandSpotify size={24} />
                </a>
              )}
              {profile?.twitter && (
                <a
                  href={profile.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1DA1F2] transition-colors"
                  title="Twitter / X"
                >
                  <IconBrandTwitter size={24} />
                </a>
              )}
              {profile?.instagram && (
                <a
                  href={profile.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#E4405F] transition-colors"
                  title="Instagram"
                >
                  <IconBrandInstagram size={24} />
                </a>
              )}
              {profile?.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <IconBrandGithub size={24} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlayerInventory steamId={steamId} inventoryData={data.inventory} />

      <PlayerTabs stats={stats} matchHistory={data.matchHistory} />


    </div>
  );
}

