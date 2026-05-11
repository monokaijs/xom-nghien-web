"use client";

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {IconFlame, IconTarget, IconTrophy, IconAward} from '@tabler/icons-react';
import {LeaderboardPlayer, LeaderboardPlayerRaw, LeaderboardResponse, LeaderboardType} from '@/types/leaderboard';

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<LeaderboardType>('kills');
  const [allTimePlayers, setAllTimePlayers] = useState<LeaderboardPlayer[]>([]);
  const [weeklyPlayers, setWeeklyPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTimeData, setAllTimeData] = useState<LeaderboardResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [allTimeResponse, weeklyResponse] = await Promise.all([
          fetch('/api/leaderboard?timeframe=all'),
          fetch('/api/leaderboard?timeframe=weekly'),
        ]);
        const allTimeApiData: LeaderboardResponse = await allTimeResponse.json();
        const weeklyApiData: LeaderboardResponse = await weeklyResponse.json();
        setAllTimeData(allTimeApiData);
        setWeeklyData(weeklyApiData);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setAllTimeData(null);
        setWeeklyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const processData = (data: LeaderboardResponse | null): LeaderboardPlayer[] => {
      if (!data) return [];

      let rawPlayers: LeaderboardPlayerRaw[] = [];
      let valueField: keyof LeaderboardPlayerRaw = 'total_kills';

      switch (activeType) {
        case 'kills':
          rawPlayers = data.topKillers || [];
          valueField = 'total_kills';
          break;
        case 'headshots':
          rawPlayers = data.topHeadshot || [];
          valueField = 'total_headshots';
          break;
        case 'damage':
          rawPlayers = data.topDamage || [];
          valueField = 'total_damage';
          break;
        case 'kda':
          rawPlayers = data.topKDA || [];
          valueField = 'kda_ratio';
          break;
      }

      return rawPlayers.map((player, index) => ({
        rank: index + 1,
        steamId: player.steamid64,
        name: player.name,
        avatar: player.avatar,
        value: activeType === 'kda' ? parseFloat(player[valueField] as string) || 0 : parseInt(player[valueField] as string) || 0,
        kills: parseInt(player.total_kills) || 0,
        deaths: parseInt(player.total_deaths) || 0,
        damage: parseInt(player.total_damage) || 0,
        headshots: parseInt(player.total_headshots) || 0,
        assists: parseInt(player.total_assists || '0') || 0,
        headshotPercentage: player.headshot_percentage ? parseFloat(player.headshot_percentage) : undefined,
        kdaRatio: player.kda_ratio ? parseFloat(player.kda_ratio) : undefined,
      }));
    };

    setAllTimePlayers(processData(allTimeData));
    setWeeklyPlayers(processData(weeklyData));
  }, [allTimeData, weeklyData, activeType]);

  const getTypeLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'kills':
        return 'Sát Thủ';
      case 'headshots':
        return 'Bắn Đầu';
      case 'damage':
        return 'Sát Thương';
      case 'kda':
        return 'KDA';
    }
  };

  const getTypeIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'kills':
        return <IconTrophy size={20}/>;
      case 'headshots':
        return <IconTarget size={20}/>;
      case 'damage':
        return <IconFlame size={20}/>;
      case 'kda':
        return <IconAward size={20}/>;
    }
  };

  const formatValue = (value: number, type: LeaderboardType) => {
    if (type === 'damage') {
      return value.toLocaleString();
    }
    if (type === 'kda') {
      return value.toFixed(2);
    }
    return value.toString();
  };

  const renderLeaderboardList = (players: LeaderboardPlayer[], isLoading: boolean) => {
    if (isLoading) {
      return Array.from({length: 10}).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-white/10"></div>
          <div className="w-12 h-12 rounded-full bg-white/10"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-white/10 rounded"></div>
        </div>
      ));
    }

    if (players.length === 0) {
      return <div className="text-center py-10 text-white/50">Không có dữ liệu</div>;
    }

    return players.map((player, index) => (
      <div
        key={player.steamId}
        onClick={() => router.push(`/player/${player.steamId}`)}
        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-white/10 cursor-pointer ${
          index < 3 ? 'bg-white/5' : 'bg-transparent'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
            index === 0
              ? 'bg-yellow-500/20 text-yellow-400'
              : index === 1
                ? 'bg-gray-400/20 text-gray-300'
                : index === 2
                  ? 'bg-orange-600/20 text-orange-400'
                  : 'bg-white/5 text-white/60'
          }`}
        >
          {player.rank}
        </div>

        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#555] flex-shrink-0">
          <img
            src={player.avatar}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-base font-medium truncate">{player.name}</div>
          <div className="text-sm text-white/50">
            {activeType === 'headshots' && player.headshotPercentage
              ? `${player.headshotPercentage.toFixed(1)}% accuracy`
              : activeType === 'kda'
                ? `${player.kills}K / ${player.deaths}D / ${player.assists}A`
                : `${player.kills}K / ${player.deaths}D`}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-accent-primary">
            {formatValue(player.value, activeType)}
          </div>
          <div className="text-xs text-white/50">
            {activeType === 'damage' ? 'DMG' : activeType === 'headshots' ? 'HS' : activeType === 'kda' ? 'KDA' : 'K'}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Bảng Xếp Hạng</h1>

      <div className="flex gap-3 mb-6 max-md:flex-col">
        {(['kills', 'headshots', 'damage', 'kda'] as LeaderboardType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeType === type
                ? 'bg-accent-primary text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {getTypeIcon(type)}
            <span>{getTypeLabel(type)}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
          <h2 className="text-xl font-bold mb-4">Mọi Thời Đại</h2>
          <div className="flex flex-col gap-3">
            {renderLeaderboardList(allTimePlayers, loading)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
          <h2 className="text-xl font-bold mb-4">Tuần Này</h2>
          <div className="flex flex-col gap-3">
            {renderLeaderboardList(weeklyPlayers, loading)}
          </div>
        </div>
      </div>
    </div>
  );
}

