"use client";

import React, { useEffect, useState } from 'react';
import { IconSearch, IconTrophy, IconUsers, IconCalendar, IconClock } from '@tabler/icons-react';
import Link from 'next/link';

interface Tournament {
  id: number;
  team1_name: string;
  team2_name: string;
  num_maps: number;
  maplist: string[];
  clinch_series: number;
  players_per_team: number;
  registration_deadline: string | null;
  created_at: string;
}

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, [search]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/tournaments?${params}`);
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRegistrationOpen = (deadline: string | null) => {
    if (!deadline) return true;
    return new Date() < new Date(deadline);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Giải Đấu CS2</h2>
        <p className="text-white/60 text-sm">Xem và đăng ký tham gia các giải đấu</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm giải đấu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/50">Đang tải...</div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/50">Không tìm thấy giải đấu</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const regOpen = isRegistrationOpen(tournament.registration_deadline);
            return (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:bg-white/10 transition-all hover:border-accent-primary/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-accent-primary">
                    <IconTrophy size={24} />
                    <span className="font-bold">#{tournament.id}</span>
                  </div>
                  {tournament.registration_deadline && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      regOpen 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {regOpen ? 'Đang mở' : 'Đã đóng'}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-4 text-white">
                  {tournament.team1_name} vs {tournament.team2_name}
                </h3>

                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <IconTrophy size={16} />
                    <span>BO{tournament.num_maps}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconUsers size={16} />
                    <span>{tournament.players_per_team}v{tournament.players_per_team}</span>
                  </div>
                  {tournament.registration_deadline && (
                    <div className="flex items-center gap-2">
                      <IconClock size={16} />
                      <span className="text-xs">Hạn: {formatDate(tournament.registration_deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <IconCalendar size={16} />
                    <span className="text-xs">Tạo: {formatDate(tournament.created_at)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

