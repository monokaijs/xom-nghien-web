"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconClock, IconMap, IconTrophy, IconUsers, IconCalendar } from '@tabler/icons-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getMapImage } from "@/lib/utils/mapImage";

interface Tournament {
  id: number;
  team1_name: string;
  team2_name: string;
  num_maps: number;
  maplist: string[];
  clinch_series: number;
  players_per_team: number;
  cvars: Record<string, string>;
  registration_deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface Player {
  id: number;
  tournament_id: number;
  team_number: number;
  steamid64: string;
  player_name: string;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const tournamentId = params?.id as string;

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament');
      }
      const data = await response.json();
      setTournament(data.tournament);
      setPlayers(data.players);
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (teamNumber: number) => {
    if (!session?.user) {
      alert('Vui lòng đăng nhập để đăng ký');
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_number: teamNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đăng ký thành công!');
        fetchTournamentData();
      } else {
        alert(data.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Đã xảy ra lỗi khi đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!session?.user) return;

    if (!confirm('Bạn có chắc muốn hủy đăng ký?')) return;

    try {
      setRegistering(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Hủy đăng ký thành công!');
        fetchTournamentData();
      } else {
        alert(data.error || 'Hủy đăng ký thất bại');
      }
    } catch (error) {
      console.error('Error unregistering:', error);
      alert('Đã xảy ra lỗi khi hủy đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/50">Đang tải...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-white/50">Không tìm thấy giải đấu</div>
        <Link href="/tournaments" className="text-accent-primary hover:underline">
          Quay lại danh sách giải đấu
        </Link>
      </div>
    );
  }

  const team1Players = players.filter(p => p.team_number === 1);
  const team2Players = players.filter(p => p.team_number === 2);
  const userRegistration = session?.user ? players.find(p => p.steamid64 === session.user.steamId) : null;

  const isRegistrationOpen = tournament.registration_deadline
    ? new Date() < new Date(tournament.registration_deadline)
    : true;

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

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/tournaments"
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit"
      >
        <IconArrowLeft size={20} />
        <span>Quay Lại</span>
      </Link>

      <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {tournament.team1_name} vs {tournament.team2_name}
            </h1>
            <div className="flex items-center gap-4 text-white/60">
              <div className="flex items-center gap-2">
                <IconTrophy size={18} />
                <span>BO{tournament.num_maps}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconUsers size={18} />
                <span>{tournament.players_per_team}v{tournament.players_per_team}</span>
              </div>
              {tournament.registration_deadline && (
                <div className="flex items-center gap-2">
                  <IconCalendar size={18} />
                  <span>Hạn đăng ký: {formatDate(tournament.registration_deadline)}</span>
                </div>
              )}
            </div>
          </div>
          {!isRegistrationOpen && (
            <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
              Đã hết hạn đăng ký
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <IconMap size={20} />
            Bản đồ
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {tournament.maplist.map((map, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-xl overflow-hidden group"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${getMapImage(map)})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                  <span className="text-white text-sm font-medium">{map}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                    <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary font-bold">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{player.player_name}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/40 text-center py-4">Chưa có người đăng ký</div>
              )}
            </div>
            {session?.user && isRegistrationOpen && !userRegistration && team1Players.length < tournament.players_per_team && (
              <button
                onClick={() => handleRegister(1)}
                disabled={registering}
                className="w-full mt-4 bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Đang xử lý...' : 'Đăng ký đội này'}
              </button>
            )}
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
                    <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary font-bold">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{player.player_name}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/40 text-center py-4">Chưa có người đăng ký</div>
              )}
            </div>
            {session?.user && isRegistrationOpen && !userRegistration && team2Players.length < tournament.players_per_team && (
              <button
                onClick={() => handleRegister(2)}
                disabled={registering}
                className="w-full mt-4 bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Đang xử lý...' : 'Đăng ký đội này'}
              </button>
            )}
          </div>
        </div>

        {userRegistration && isRegistrationOpen && (
          <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <IconUsers size={20} className="text-green-400" />
                </div>
                <div>
                  <div className="text-green-400 font-semibold">Bạn đã đăng ký</div>
                  <div className="text-white/60 text-sm">
                    Đội: {userRegistration.team_number === 1 ? tournament.team1_name : tournament.team2_name}
                  </div>
                </div>
              </div>
              <button
                onClick={handleUnregister}
                disabled={registering}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Đang xử lý...' : 'Hủy đăng ký'}
              </button>
            </div>
          </div>
        )}

        {!session?.user && isRegistrationOpen && (
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-blue-400">Vui lòng đăng nhập để đăng ký tham gia giải đấu</p>
          </div>
        )}
      </div>
    </div>
  );
}

