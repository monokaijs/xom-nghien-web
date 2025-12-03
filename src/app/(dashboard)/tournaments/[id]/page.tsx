import React from 'react';
import {IconArrowLeft, IconCalendar, IconMap, IconTrophy, IconUsers} from '@tabler/icons-react';
import Link from 'next/link';
import {getMapImage} from "@/lib/utils/mapImage";
import {db} from '@/lib/database';
import {tournamentPlayers, tournaments, userInfo} from '@/lib/db/schema';
import {eq, sql} from 'drizzle-orm';
import {notFound} from 'next/navigation';
import TournamentRegistration from './TournamentRegistration';
import Image from 'next/image';
import {cookies} from 'next/headers';
import {decode} from 'next-auth/jwt';

interface Tournament {
  id: number;
  team1_name: string;
  team2_name: string;
  num_maps: number;
  maplist: string[];
  clinch_series: number;
  players_per_team: number;
  cvars: Record<string, string>;
  registration_deadline: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface Player {
  id: number;
  tournament_id: number;
  team_number: number;
  steamid64: string;
  player_name: string;
  avatar: string | null;
  avatarmedium: string | null;
  avatarfull: string | null;
}

async function getTournamentData(id: string) {
  const tournamentId = parseInt(id);

  if (isNaN(tournamentId)) {
    return null;
  }

  const tournamentResult = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (tournamentResult.length === 0) {
    return null;
  }

  const tournament = tournamentResult[0];

  const playersQuery = sql`
      SELECT tp.id,
             tp.tournament_id,
             tp.team_number,
             tp.steamid64,
             tp.player_name,
             ui.avatar,
             ui.avatarmedium,
             ui.avatarfull
      FROM ${tournamentPlayers} tp
               LEFT JOIN ${userInfo} ui ON tp.steamid64 = ui.steamid64
      WHERE tp.tournament_id = ${tournamentId}
      ORDER BY tp.team_number, tp.id
  `;

  const playersResult = await db.execute(playersQuery);
  const playersData = playersResult[0] as unknown as Player[];

  return {
    tournament,
    players: playersData,
  };
}

export default async function TournamentDetailPage({params}: { params: Promise<{ id: string }> }) {
  const {id} = await params;
  const data = await getTournamentData(id);

  if (!data) {
    notFound();
  }

  const {tournament, players} = data;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  let userSteamId: string | null = null;
  if (sessionToken) {
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      userSteamId = token?.steamId as string || null;
    } catch (error) {
      console.error('Error decoding session:', error);
    }
  }

  const team1Players = players.filter(p => p.team_number === 1);
  const team2Players = players.filter(p => p.team_number === 2);
  const userRegistration = userSteamId ? players.find(p => p.steamid64 === userSteamId) : null;

  const isRegistrationOpen = tournament.registration_deadline
    ? new Date() < new Date(tournament.registration_deadline)
    : true;

  const team1Full = team1Players.length >= tournament.players_per_team;
  const team2Full = team2Players.length >= tournament.players_per_team;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <IconArrowLeft size={20}/>
          Quay lại danh sách giải đấu
        </Link>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {tournament.team1_name} vs {tournament.team2_name}
            </h1>
            <div className="flex items-center gap-4 text-white/60">
              <div className="flex items-center gap-2">
                <IconTrophy size={18}/>
                <span>BO{tournament.num_maps}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconUsers size={18}/>
                <span>{tournament.players_per_team}v{tournament.players_per_team}</span>
              </div>
              {tournament.registration_deadline && (
                <div className="flex items-center gap-2">
                  <IconCalendar size={18}/>
                  <span>Hạn đăng ký: {formatDate(tournament.registration_deadline)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <IconMap size={24}/>
            Bản Đồ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tournament.maplist.map((map, index) => (
              <div key={index} className="relative aspect-video rounded-xl overflow-hidden">
                <Image
                  src={getMapImage(map)}
                  alt={map}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <span className="text-white font-medium text-sm">{map}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Danh Sách Người Chơi</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{tournament.team1_name}</h3>
                <span className="text-white/60 text-sm">
                  {team1Players.length}/{tournament.players_per_team}
                </span>
              </div>
              <div className="space-y-2">
                {team1Players.length > 0 ? (
                  team1Players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                    >
                      {player.avatar ? (
                        <Image
                          src={player.avatar}
                          alt={player.player_name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary font-bold">
                          {player.player_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-white">{player.player_name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-white/40 text-sm text-center py-4">
                    Chưa có người chơi
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{tournament.team2_name}</h3>
                <span className="text-white/60 text-sm">
                  {team2Players.length}/{tournament.players_per_team}
                </span>
              </div>
              <div className="space-y-2">
                {team2Players.length > 0 ? (
                  team2Players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                    >
                      {player.avatar ? (
                        <Image
                          src={player.avatar}
                          alt={player.player_name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary font-bold">
                          {player.player_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-white">{player.player_name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-white/40 text-sm text-center py-4">
                    Chưa có người chơi
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <TournamentRegistration
          tournamentId={tournament.id}
          userRegistration={userRegistration}
          isRegistrationOpen={isRegistrationOpen}
          team1Full={team1Full}
          team2Full={team2Full}
        />
      </div>
    </div>
  );
}
