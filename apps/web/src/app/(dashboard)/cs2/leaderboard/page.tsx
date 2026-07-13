"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IconAward, IconFlame, IconTarget, IconTrophy } from '@tabler/icons-react';
import type {
  LeaderboardPlayer,
  LeaderboardPlayerRaw,
  LeaderboardResponse,
  LeaderboardType,
} from '@/types/leaderboard';

const FALLBACK_AVATAR = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

const METRICS: LeaderboardType[] = ['kills', 'headshots', 'damage', 'kda'];

function getMetricLabel(type: LeaderboardType) {
  switch (type) {
    case 'kills': return 'Sát Thủ';
    case 'headshots': return 'Bắn Đầu';
    case 'damage': return 'Sát Thương';
    case 'kda': return 'KDA';
  }
}

function getMetricIcon(type: LeaderboardType) {
  switch (type) {
    case 'kills': return <IconTrophy size={20} aria-hidden="true" />;
    case 'headshots': return <IconTarget size={20} aria-hidden="true" />;
    case 'damage': return <IconFlame size={20} aria-hidden="true" />;
    case 'kda': return <IconAward size={20} aria-hidden="true" />;
  }
}

function getRawPlayers(data: LeaderboardResponse | null, type: LeaderboardType): LeaderboardPlayerRaw[] {
  if (!data) return [];

  switch (type) {
    case 'kills': return data.topKillers || [];
    case 'headshots': return data.topHeadshot || [];
    case 'damage': return data.topDamage || [];
    case 'kda': return data.topKDA || [];
  }
}

function toPlayers(data: LeaderboardResponse | null, type: LeaderboardType): LeaderboardPlayer[] {
  const valueField: keyof LeaderboardPlayerRaw = type === 'kills'
    ? 'total_kills'
    : type === 'headshots'
      ? 'total_headshots'
      : type === 'damage'
        ? 'total_damage'
        : 'kda_ratio';

  return getRawPlayers(data, type).map((player, index) => ({
    rank: index + 1,
    steamId: player.steamid64,
    name: player.name || 'Người chơi ẩn danh',
    avatar: player.avatar,
    value: Number(player[valueField]) || 0,
    kills: Number(player.total_kills) || 0,
    deaths: Number(player.total_deaths) || 0,
    damage: Number(player.total_damage) || 0,
    headshots: Number(player.total_headshots) || 0,
    assists: Number(player.total_assists) || 0,
    headshotPercentage: player.headshot_percentage === undefined ? undefined : Number(player.headshot_percentage) || 0,
    kdaRatio: player.kda_ratio === undefined ? undefined : Number(player.kda_ratio) || 0,
  }));
}

function formatValue(value: number, type: LeaderboardType) {
  if (type === 'damage') return value.toLocaleString('vi-VN');
  if (type === 'kda') return value.toFixed(2);
  return value.toLocaleString('vi-VN');
}

function valueUnit(type: LeaderboardType) {
  switch (type) {
    case 'damage': return 'DMG';
    case 'headshots': return 'HS';
    case 'kda': return 'KDA';
    case 'kills': return 'K';
  }
}

function PlayerList({ players, type, loading }: { players: LeaderboardPlayer[]; type: LeaderboardType; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Đang tải bảng xếp hạng">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-4 rounded-xl bg-white/5 p-4">
            <div className="h-10 w-10 rounded-full bg-white/10" />
            <div className="h-12 w-12 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
            <div className="h-7 w-14 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return <p className="py-10 text-center text-white/50">Không có dữ liệu</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {players.map((player, index) => (
        <li key={player.steamId}>
          <Link
            href={`/player/${player.steamId}`}
            className={`flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${index < 3 ? 'bg-white/5' : ''}`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                index === 0
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : index === 1
                    ? 'bg-gray-400/20 text-gray-300'
                    : index === 2
                      ? 'bg-orange-600/20 text-orange-400'
                      : 'bg-white/5 text-white/60'
              }`}
              aria-label={`Hạng ${player.rank}`}
            >
              {player.rank}
            </span>

            <img
              src={player.avatar || FALLBACK_AVATAR}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full bg-[#555] object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== FALLBACK_AVATAR) event.currentTarget.src = FALLBACK_AVATAR;
              }}
            />

            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{player.name}</span>
              <span className="block text-sm text-white/50">
                {type === 'headshots' && player.headshotPercentage !== undefined
                  ? `${player.headshotPercentage.toFixed(1)}% chính xác`
                  : type === 'kda'
                    ? `${player.kills}K / ${player.deaths}D / ${player.assists}A`
                    : `${player.kills}K / ${player.deaths}D`}
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-2xl font-bold text-accent-primary">{formatValue(player.value, type)}</span>
              <span className="block text-xs text-white/50">{valueUnit(type)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function Cs2LeaderboardPage() {
  const [activeType, setActiveType] = useState<LeaderboardType>('kills');
  const [allTimeData, setAllTimeData] = useState<LeaderboardResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    const fetchLeaderboard = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const [allTimeResponse, weeklyResponse] = await Promise.all([
          fetch('/api/leaderboard?timeframe=all', { signal: controller.signal }),
          fetch('/api/leaderboard?timeframe=weekly', { signal: controller.signal }),
        ]);

        if (!allTimeResponse.ok || !weeklyResponse.ok) {
          throw new Error('Không thể tải dữ liệu bảng xếp hạng');
        }

        const [allTime, weekly] = await Promise.all([
          allTimeResponse.json() as Promise<LeaderboardResponse>,
          weeklyResponse.json() as Promise<LeaderboardResponse>,
        ]);

        if (!disposed) {
          setAllTimeData(allTime);
          setWeeklyData(weekly);
        }
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        console.error('Failed to fetch leaderboard:', fetchError);
        if (!disposed) setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải bảng xếp hạng');
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void fetchLeaderboard(true);
    const interval = window.setInterval(() => void fetchLeaderboard(false), 60_000);

    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [retryKey]);

  const allTimePlayers = useMemo(() => toPlayers(allTimeData, activeType), [allTimeData, activeType]);
  const weeklyPlayers = useMemo(() => toPlayers(weeklyData, activeType), [weeklyData, activeType]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm font-medium text-accent-primary">Counter-Strike 2</p>
        <h1 className="text-3xl font-bold max-sm:text-2xl">Bảng Xếp Hạng</h1>
      </header>

      <div className="flex gap-3 max-md:grid max-md:grid-cols-2" role="group" aria-label="Chọn chỉ số xếp hạng">
        {METRICS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
              activeType === type
                ? 'bg-accent-primary text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {getMetricIcon(type)}
            {getMetricLabel(type)}
          </button>
        ))}
      </div>

      {error && !allTimeData && !weeklyData ? (
        <div className="rounded-[25px] bg-card-bg p-8 text-center" role="alert">
          <p className="text-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="mt-4 rounded-xl bg-accent-primary px-4 py-2 font-medium text-white transition-colors hover:bg-accent-primary/80"
          >
            Thử Lại
          </button>
        </div>
      ) : (
        <>
          {error && <p className="text-sm text-amber-300" role="status">Dữ liệu tự động làm mới chưa thành công.</p>}
          <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            <section className="rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-6 max-sm:p-4" aria-labelledby="all-time-heading">
              <h2 id="all-time-heading" className="mb-4 text-xl font-bold">Mọi Thời Đại</h2>
              <PlayerList players={allTimePlayers} type={activeType} loading={loading} />
            </section>

            <section className="rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-6 max-sm:p-4" aria-labelledby="weekly-heading">
              <h2 id="weekly-heading" className="mb-4 text-xl font-bold">Tuần Này</h2>
              <PlayerList players={weeklyPlayers} type={activeType} loading={loading} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
