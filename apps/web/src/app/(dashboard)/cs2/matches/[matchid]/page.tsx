import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconArrowLeft, IconClock, IconMap, IconTrophy } from '@tabler/icons-react';
import { db, matchzyStatsMaps, matchzyStatsMatches, matchzyStatsPlayers, sql } from '@xom/db';
import { getMapImage } from '@/lib/utils/mapImage';

export const dynamic = 'force-dynamic';

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

interface MatchMap {
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

interface MatchDetail {
  match: Match;
  maps: MatchMap[];
  players: Player[];
}

async function getMatchData(rawMatchId: string): Promise<MatchDetail | null> {
  if (!/^\d+$/.test(rawMatchId)) return null;

  const matchId = Number(rawMatchId);
  if (!Number.isSafeInteger(matchId) || matchId <= 0) return null;

  try {
    const matchResult = await db.execute(sql`
      SELECT *
      FROM ${matchzyStatsMatches}
      WHERE matchid = ${matchId}
      LIMIT 1
    `);
    const match = (matchResult[0] as unknown as Match[])[0];

    if (!match) return null;

    const [mapsResult, playersResult] = await Promise.all([
      db.execute(sql`
        SELECT *
        FROM ${matchzyStatsMaps}
        WHERE matchid = ${matchId}
        ORDER BY mapnumber ASC
      `),
      db.execute(sql`
        SELECT p.*, m.mapname
        FROM ${matchzyStatsPlayers} p
        JOIN ${matchzyStatsMaps} m
          ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
        WHERE p.matchid = ${matchId}
        ORDER BY p.mapnumber ASC, p.kills DESC
      `),
    ]);

    return {
      match,
      maps: mapsResult[0] as unknown as MatchMap[],
      players: playersResult[0] as unknown as Player[],
    };
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function TeamRoster({
  headingId,
  teamName,
  players,
  isWinner,
}: {
  headingId: string;
  teamName: string;
  players: Player[];
  isWinner: boolean;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className={`mb-4 text-lg font-semibold max-md:mb-3 max-md:text-base ${isWinner ? 'text-accent-primary' : 'text-white/70'}`}
      >
        {teamName || 'Đội chưa đặt tên'}
      </h3>

      <div className="mb-2 hidden grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-white/10 px-3 pb-2 text-xs font-semibold text-white/50 md:grid" aria-hidden="true">
        <span>Người Chơi</span>
        <span className="text-center">K</span>
        <span className="text-center">D</span>
        <span className="text-center">A</span>
        <span className="text-center">KDA</span>
        <span className="text-center">HS</span>
      </div>

      {players.length > 0 ? (
        <div className="space-y-2">
          {players.map((player) => {
            const kills = Number(player.kills) || 0;
            const deaths = Number(player.deaths) || 0;
            const assists = Number(player.assists) || 0;
            const headshots = Number(player.head_shot_kills) || 0;
            const damage = Number(player.damage) || 0;
            const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
            const headshotRate = kills > 0 ? (headshots / kills) * 100 : 0;

            return (
              <Link
                key={player.steamid64}
                href={`/player/${player.steamid64}`}
                className="block rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary max-md:p-2.5"
              >
                <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] items-center gap-2 max-md:block">
                  <div className="min-w-0">
                    <p className="truncate font-medium max-md:text-sm">{player.name}</p>
                    <p className="mt-1 hidden text-xs text-white/50 max-md:block">
                      K/D/A: {kills}/{deaths}/{assists} · KDA: {kda.toFixed(2)} · HS: {headshots}
                    </p>
                    <p className="mt-0.5 hidden text-xs text-white/50 max-md:block">
                      DMG: {damage.toLocaleString('vi-VN')} · HS: {headshotRate.toFixed(1)}%
                    </p>
                  </div>
                  <span className="text-center font-bold text-accent-primary max-md:hidden">{kills}</span>
                  <span className="text-center text-white/70 max-md:hidden">{deaths}</span>
                  <span className="text-center text-white/70 max-md:hidden">{assists}</span>
                  <span className="text-center font-semibold text-green-400 max-md:hidden">{kda.toFixed(2)}</span>
                  <span className="text-center text-yellow-400 max-md:hidden">{headshots}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/50 max-md:hidden">
                  <span>Sát Thương: {damage.toLocaleString('vi-VN')}</span>
                  <span>HS: {headshotRate.toFixed(1)}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 p-5 text-center text-sm text-white/50">Không có dữ liệu người chơi</div>
      )}
    </section>
  );
}

export default async function Cs2MatchDetailPage({
  params,
}: {
  params: Promise<{ matchid: string }>;
}) {
  const { matchid } = await params;
  const data = await getMatchData(matchid);

  if (!data) notFound();

  const { match, maps, players } = data;
  const isTeam1Winner = match.winner === match.team1_name || match.team1_score > match.team2_score;
  const isTeam2Winner = match.winner === match.team2_name || match.team2_score > match.team1_score;
  const firstMap = maps[0];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cs2/matches"
        className="flex w-fit items-center gap-2 rounded-lg text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <IconArrowLeft size={20} aria-hidden="true" />
        <span>Quay Lại Lịch Sử Trận Đấu</span>
      </Link>

      <section className="relative overflow-hidden rounded-[30px]" aria-labelledby="match-heading">
        <div className="absolute inset-0">
          {firstMap?.mapname && (
            <img src={getMapImage(firstMap.mapname)} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b161b]/85 to-[#1a0f12]/90" />
        </div>

        <div className="relative z-10 p-6 max-md:p-4">
          <p className="mb-2 text-sm font-medium text-accent-primary">Counter-Strike 2</p>
          <h1 id="match-heading" className="sr-only">
            {match.team1_name} gặp {match.team2_name}
          </h1>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-white/70 max-md:mb-4 max-md:gap-2 max-md:text-xs">
            <span className="flex items-center gap-2">
              <IconTrophy size={16} className="text-accent-primary" aria-hidden="true" />
              {match.series_type || 'Trận đấu CS2'}
            </span>
            <time dateTime={match.start_time} className="flex items-center gap-2">
              <IconClock size={16} aria-hidden="true" />
              {formatDate(match.start_time)}
            </time>
          </div>

          <div className="mb-5 flex items-center justify-between gap-8 max-md:gap-3">
            <p className={`min-w-0 flex-1 truncate text-right text-2xl font-bold max-md:text-base ${isTeam1Winner ? 'text-white' : 'text-white/60'}`}>
              {match.team1_name}
            </p>
            <div className="flex items-center gap-6 rounded-2xl bg-white/10 px-8 py-4 backdrop-blur-sm max-md:gap-3 max-md:px-4 max-md:py-2">
              <span className={`text-4xl font-bold max-md:text-2xl ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>{match.team1_score}</span>
              <span className="text-2xl text-white/50 max-md:text-lg" aria-hidden="true">–</span>
              <span className={`text-4xl font-bold max-md:text-2xl ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>{match.team2_score}</span>
            </div>
            <p className={`min-w-0 flex-1 truncate text-left text-2xl font-bold max-md:text-base ${isTeam2Winner ? 'text-white' : 'text-white/60'}`}>
              {match.team2_name}
            </p>
          </div>

          {(isTeam1Winner || isTeam2Winner) && (
            <p className="text-center font-semibold text-accent-primary">
              <IconTrophy size={17} className="mr-1 inline" aria-hidden="true" />
              {isTeam1Winner ? match.team1_name : match.team2_name} Chiến Thắng
            </p>
          )}
        </div>
      </section>

      {maps.length > 0 ? maps.map((map) => {
        const mapPlayers = players.filter((player) => player.mapnumber === map.mapnumber);
        const team1Players = mapPlayers.filter((player) => player.team === match.team1_name).sort((a, b) => b.kills - a.kills);
        const team2Players = mapPlayers.filter((player) => player.team === match.team2_name).sort((a, b) => b.kills - a.kills);
        const isMapTeam1Winner = map.winner === match.team1_name || map.team1_score > map.team2_score;
        const isMapTeam2Winner = map.winner === match.team2_name || map.team2_score > map.team1_score;

        return (
          <section key={map.mapnumber} className="rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-6 max-md:p-4" aria-labelledby={`map-${map.mapnumber}`}>
            <header className="mb-6 flex items-center justify-between gap-4 max-md:mb-4">
              <div className="flex min-w-0 items-center gap-3">
                <IconMap size={24} className="shrink-0 text-accent-primary" aria-hidden="true" />
                <h2 id={`map-${map.mapnumber}`} className="truncate text-xl font-semibold max-md:text-lg">{map.mapname}</h2>
              </div>
              <p className="flex shrink-0 items-center gap-4 rounded-xl bg-white/5 px-4 py-2 max-md:gap-2 max-md:px-3 max-md:py-1.5" aria-label={`Tỉ số bản đồ ${map.team1_score}–${map.team2_score}`}>
                <span className={`text-xl font-bold max-md:text-lg ${isMapTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>{map.team1_score}</span>
                <span className="text-white/50" aria-hidden="true">–</span>
                <span className={`text-xl font-bold max-md:text-lg ${isMapTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>{map.team2_score}</span>
              </p>
            </header>

            <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1 max-lg:gap-5">
              <TeamRoster headingId={`map-${map.mapnumber}-team-1`} teamName={match.team1_name} players={team1Players} isWinner={isMapTeam1Winner} />
              <TeamRoster headingId={`map-${map.mapnumber}-team-2`} teamName={match.team2_name} players={team2Players} isWinner={isMapTeam2Winner} />
            </div>
          </section>
        );
      }) : (
        <div className="rounded-[25px] bg-card-bg p-8 text-center text-white/50">Không có dữ liệu bản đồ</div>
      )}
    </div>
  );
}
