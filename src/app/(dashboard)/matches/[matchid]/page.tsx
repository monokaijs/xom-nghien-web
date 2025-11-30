import React from 'react';
import {notFound} from 'next/navigation';
import {IconArrowLeft, IconClock, IconMap, IconTrophy} from '@tabler/icons-react';
import Image from 'next/image';
import {db} from '@/lib/database';
import {matchzyStatsMatches, matchzyStatsMaps, matchzyStatsPlayers} from '@/lib/db/schema';
import {sql} from 'drizzle-orm';
import Link from 'next/link';
import {getMapImage} from "@/lib/utils/mapImage";

interface Match {
  matchid: number;
  start_time: string;
  end_time: string | null;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  series_type: string;
  winner: string;
  server_ip: string;
}

interface Map {
  matchid: number;
  mapnumber: number;
  start_time: string;
  end_time: string | null;
  winner: string;
  mapname: string;
  team1_score: number;
  team2_score: number;
}

interface Player {
  matchid: number;
  mapnumber: number;
  steamid64: string;
  team: string;
  name: string;
  kills: number;
  deaths: number;
  damage: number;
  assists: number;
  head_shot_kills: number;
  mapname: string;
}

interface MatchDetailResponse {
  match: Match;
  maps: Map[];
  players: Player[];
}

async function getMatchData(matchid: string): Promise<MatchDetailResponse | null> {
  try {
    const matchId = parseInt(matchid);

    if (isNaN(matchId)) {
      return null;
    }

    const matchQuery = sql`
      SELECT * FROM ${matchzyStatsMatches}
      WHERE matchid = ${matchId}
    `;

    const matchResult = await db.execute(matchQuery);
    const match = (matchResult[0] as unknown as any[])[0];

    if (!match) {
      return null;
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

    const [mapsResult, playersResult] = await Promise.all([
      db.execute(mapsQuery),
      db.execute(playersQuery),
    ]);

    return {
      match,
      maps: mapsResult[0] as any,
      players: playersResult[0] as any,
    };
  } catch (error) {
    console.error('Error fetching match details:', error);
    return null;
  }
}

export default async function MatchDetailPage({params}: {params: Promise<{matchid: string}>}) {
  const {matchid} = await params;
  const data = await getMatchData(matchid);

  if (!data) {
    notFound();
  }

  const {match, maps, players} = data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlayersByMap = (mapnumber: number) => {
    return players.filter(p => p.mapnumber === mapnumber);
  };

  const getTeamPlayers = (mapnumber: number, team: string) => {
    return getPlayersByMap(mapnumber)
      .filter(p => p.team === team)
      .sort((a, b) => b.kills - a.kills);
  };

  const isTeam1Winner = match.winner === match.team1_name || (match.team1_score > match.team2_score);
  const isTeam2Winner = match.winner === match.team2_name || (match.team2_score > match.team1_score);
  const firstMap = maps && maps.length > 0 ? maps[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/matches"
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit"
      >
        <IconArrowLeft size={20}/>
        <span>Quay Lại</span>
      </Link>

      <div className="relative rounded-[30px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={getMapImage(firstMap?.mapname)}
            alt={firstMap?.mapname || 'Map'}
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b161b]/80 to-[#1a0f12]/80" />
        </div>

        <div className="relative z-10 p-6 max-md:p-4">
          <div className="flex items-center gap-4 mb-6 flex-wrap max-md:gap-2 max-md:mb-4">
            <div className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconTrophy size={16} className="text-accent-primary max-md:w-4 max-md:h-4"/>
              <span>{match.series_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconClock size={16} className="max-md:w-4 max-md:h-4"/>
              <span>{formatDate(match.start_time)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 mb-8 max-md:gap-3 max-md:mb-4">
            <div className={`flex-1 text-right ${isTeam1Winner ? 'text-white' : 'text-white/60'}`}>
              <div className="text-2xl font-bold truncate max-md:text-lg">{match.team1_name}</div>
            </div>
            <div className="flex items-center gap-6 px-8 py-4 bg-white/5 rounded-2xl max-md:gap-3 max-md:px-4 max-md:py-2">
                <span className={`text-4xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'} max-md:text-2xl`}>
                  {match.team1_score}
                </span>
              <span className="text-white/50 text-2xl max-md:text-lg">-</span>
              <span className={`text-4xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'} max-md:text-2xl`}>
                  {match.team2_score}
                </span>
            </div>
            <div className={`flex-1 text-left ${isTeam2Winner ? 'text-white' : 'text-white/60'}`}>
              <div className="text-2xl font-bold truncate max-md:text-lg">{match.team2_name}</div>
            </div>
          </div>

          {isTeam1Winner && (
            <div className="text-center text-accent-primary font-semibold mb-4 max-md:text-sm max-md:mb-2">
              🏆 {match.team1_name} Chiến Thắng
            </div>
          )}
          {isTeam2Winner && (
            <div className="text-center text-accent-primary font-semibold mb-4 max-md:text-sm max-md:mb-2">
              🏆 {match.team2_name} Chiến Thắng
            </div>
          )}
        </div>
      </div>

      {maps.map((map) => {
        const team1Players = getTeamPlayers(map.mapnumber, match.team1_name);
        const team2Players = getTeamPlayers(map.mapnumber, match.team2_name);
        const isMapTeam1Winner = map.winner === match.team1_name || (map.team1_score > map.team2_score);
        const isMapTeam2Winner = map.winner === match.team2_name || (map.team2_score > map.team1_score);

        return (
          <div key={map.mapnumber} className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6 max-md:p-4">
            <div className="flex items-center justify-between mb-6 max-md:mb-4 max-md:flex-col max-md:items-start max-md:gap-3">
              <div className="flex items-center gap-3 max-md:gap-2">
                <IconMap size={24} className="text-accent-primary max-md:w-5 max-md:h-5"/>
                <h2 className="text-xl font-semibold max-md:text-lg">{map.mapname}</h2>
              </div>
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl max-md:gap-2 max-md:px-3 max-md:py-1.5">
                  <span className={`text-xl font-bold ${isMapTeam1Winner ? 'text-accent-primary' : 'text-white/60'} max-md:text-lg`}>
                    {map.team1_score}
                  </span>
                <span className="text-white/50 max-md:text-sm">-</span>
                <span className={`text-xl font-bold ${isMapTeam2Winner ? 'text-accent-primary' : 'text-white/60'} max-md:text-lg`}>
                    {map.team2_score}
                  </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-4">
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${isMapTeam1Winner ? 'text-accent-primary' : 'text-white/70'} max-md:text-base max-md:mb-3`}>
                  {match.team1_name}
                </h3>

                <div
                  className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 pb-2 text-xs text-white/50 font-semibold border-b border-white/10 mb-2">
                  <div>Người Chơi</div>
                  <div className="text-center">K</div>
                  <div className="text-center">D</div>
                  <div className="text-center">A</div>
                  <div className="text-center">KDA</div>
                  <div className="text-center">HS</div>
                </div>

                <div className="space-y-2">
                  {team1Players.map((player) => {
                    const kda = player.deaths > 0
                      ? ((player.kills + player.assists) / player.deaths).toFixed(2)
                      : (player.kills + player.assists).toFixed(2);

                    return (
                      <Link
                        key={player.steamid64}
                        href={`/player/${player.steamid64}`}
                        className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer max-md:p-2.5 block"
                      >
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 items-center max-md:grid-cols-1 max-md:gap-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate max-md:text-sm">{player.name}</div>
                              <div className="text-xs text-white/50 md:hidden mt-1">
                                K/D/A: {player.kills}/{player.deaths}/{player.assists} • KDA: {kda} • HS: {player.head_shot_kills}
                              </div>
                              <div className="text-xs text-white/50 md:hidden mt-0.5">
                                DMG: {player.damage.toLocaleString()} • HS%: {player.kills > 0 ? ((player.head_shot_kills / player.kills) * 100).toFixed(1) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-center font-bold text-accent-primary max-md:hidden">{player.kills}</div>
                          <div className="text-center text-white/70 max-md:hidden">{player.deaths}</div>
                          <div className="text-center text-white/70 max-md:hidden">{player.assists}</div>
                          <div className="text-center font-semibold text-green-400 max-md:hidden">{kda}</div>
                          <div className="text-center text-yellow-400 max-md:hidden">{player.head_shot_kills}</div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 max-md:hidden">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Sát Thương: {player.damage.toLocaleString()}</span>
                            <span>HS%: {player.kills > 0 ? ((player.head_shot_kills / player.kills) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${isMapTeam2Winner ? 'text-accent-primary' : 'text-white/70'} max-md:text-base max-md:mb-3`}>
                  {match.team2_name}
                </h3>

                <div
                  className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 pb-2 text-xs text-white/50 font-semibold border-b border-white/10 mb-2">
                  <div>Người Chơi</div>
                  <div className="text-center">K</div>
                  <div className="text-center">D</div>
                  <div className="text-center">A</div>
                  <div className="text-center">KDA</div>
                  <div className="text-center">HS</div>
                </div>

                <div className="space-y-2">
                  {team2Players.map((player) => {
                    const kda = player.deaths > 0
                      ? ((player.kills + player.assists) / player.deaths).toFixed(2)
                      : (player.kills + player.assists).toFixed(2);

                    return (
                      <Link
                        key={player.steamid64}
                        href={`/player/${player.steamid64}`}
                        className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer max-md:p-2.5 block"
                      >
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 items-center max-md:grid-cols-1 max-md:gap-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate max-md:text-sm">{player.name}</div>
                              <div className="text-xs text-white/50 md:hidden mt-1">
                                K/D/A: {player.kills}/{player.deaths}/{player.assists} • KDA: {kda} • HS: {player.head_shot_kills}
                              </div>
                              <div className="text-xs text-white/50 md:hidden mt-0.5">
                                DMG: {player.damage.toLocaleString()} • HS%: {player.kills > 0 ? ((player.head_shot_kills / player.kills) * 100).toFixed(1) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-center font-bold text-accent-primary max-md:hidden">{player.kills}</div>
                          <div className="text-center text-white/70 max-md:hidden">{player.deaths}</div>
                          <div className="text-center text-white/70 max-md:hidden">{player.assists}</div>
                          <div className="text-center font-semibold text-green-400 max-md:hidden">{kda}</div>
                          <div className="text-center text-yellow-400 max-md:hidden">{player.head_shot_kills}</div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 max-md:hidden">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Sát Thương: {player.damage.toLocaleString()}</span>
                            <span>HS%: {player.kills > 0 ? ((player.head_shot_kills / player.kills) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


