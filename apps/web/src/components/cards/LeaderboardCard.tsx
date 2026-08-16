"use client";

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import {
  LeaderboardPlayer,
  LeaderboardResponse,
} from '@/types/leaderboard';

interface LeaderboardCardProps {
  title?: string;
}

const fallbackAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

function processTopKillers(data: LeaderboardResponse | null): LeaderboardPlayer[] {
  if (!data) return [];

  return (data.topKillers || []).map((player, index) => ({
    rank: index + 1,
    steamId: player.steamid64,
    name: player.name,
    avatar: player.avatar,
    value: Number.parseInt(player.total_kills, 10) || 0,
    kills: Number.parseInt(player.total_kills, 10) || 0,
    deaths: Number.parseInt(player.total_deaths, 10) || 0,
  }));
}

export default function LeaderboardCard({ title = 'Top Sát Thủ' }: LeaderboardCardProps) {
  const headingId = useId();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard', { signal: controller.signal });
        if (!response.ok) throw new Error(`Leaderboard request failed with ${response.status}`);

        const result: LeaderboardResponse = await response.json();
        setData(result);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Error fetching leaderboard:', fetchError);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchLeaderboard();
    return () => controller.abort();
  }, []);

  const players = processTopKillers(data);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h3 id={headingId} className="text-lg font-semibold">{title}</h3>
        <Link
          href="/cs2/leaderboard"
          className="text-sm text-text-secondary transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          Xem tất cả
        </Link>
      </div>

      <div
        className="flex flex-col rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-5"
        aria-busy={loading}
      >
        {loading ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">Đang tải bảng xếp hạng...</span>
            <div className="flex flex-col gap-3" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50" role="status">
            Chưa thể tải bảng xếp hạng
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50" role="status">
            Chưa có dữ liệu xếp hạng
          </div>
        ) : (
          <ol className="flex flex-col gap-3" aria-label={title}>
            {players.slice(0, 5).map((player, index) => (
              <li key={player.steamId}>
                <Link
                  href={`/player/${player.steamId}`}
                  className={`flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary ${
                    index < 3 ? 'bg-white/5' : 'bg-transparent'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : index === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : index === 2
                            ? 'bg-orange-600/20 text-orange-400'
                            : 'bg-white/5 text-white/60'
                    }`}
                    aria-hidden="true"
                  >
                    {player.rank}
                  </span>

                  <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#555]">
                    <img
                      src={player.avatar || fallbackAvatar}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = fallbackAvatar;
                      }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{player.name}</span>
                    <span className="block text-xs text-white/50">
                      {player.kills}K / {player.deaths}D
                    </span>
                  </span>

                  <span className="flex-shrink-0 text-right">
                    <span className="block text-lg font-bold text-accent-primary">
                      {player.value.toLocaleString('vi-VN')}
                    </span>
                    <span className="block text-xs text-white/50">K</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
