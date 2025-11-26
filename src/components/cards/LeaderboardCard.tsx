"use client";

import React, { useEffect, useState } from 'react';
import {useRouter} from 'next/navigation';
import { IconFlame, IconTarget, IconTrophy } from '@tabler/icons-react';
import { LeaderboardPlayer, LeaderboardPlayerRaw, LeaderboardResponse, LeaderboardType } from '@/types/leaderboard';

interface LeaderboardCardProps {
  title?: string;
}

export default function LeaderboardCard({ title = "Bảng Xếp Hạng" }: LeaderboardCardProps) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<LeaderboardType>('kills');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/leaderboard');
        const apiData: LeaderboardResponse = await response.json();
        setData(apiData);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // Refresh every 60 seconds
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) {
      setPlayers([]);
      return;
    }

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
    }

    const processedPlayers: LeaderboardPlayer[] = rawPlayers.map((player, index) => ({
      rank: index + 1,
      steamId: player.steamid64,
      name: player.name,
      avatar: player.avatar,
      value: parseInt(player[valueField] as string) || 0,
      kills: parseInt(player.total_kills) || 0,
      deaths: parseInt(player.total_deaths) || 0,
      damage: parseInt(player.total_damage) || 0,
      headshots: parseInt(player.total_headshots) || 0,
      headshotPercentage: player.headshot_percentage ? parseFloat(player.headshot_percentage) : undefined,
    }));

    setPlayers(processedPlayers);
  }, [data, activeType]);

  const getTypeLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'kills':
        return 'Sát Thủ';
      case 'headshots':
        return 'Bắn Đầu';
      case 'damage':
        return 'Sát Thương';
    }
  };

  const getTypeIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'kills':
        return <IconTrophy size={16} />;
      case 'headshots':
        return <IconTarget size={16} />;
      case 'damage':
        return <IconFlame size={16} />;
    }
  };

  const formatValue = (value: number, type: LeaderboardType) => {
    if (type === 'damage') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center -mb-2.5">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-5 flex flex-col">
        {/* Type Selector */}
        <div className="flex gap-2 mb-5">
          {(['kills', 'headshots', 'damage'] as LeaderboardType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5 ${activeType === type
                ? 'bg-accent-primary text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                }`}
            >
              {getTypeIcon(type)}
              <span className="max-sm:hidden">{getTypeLabel(type)}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse"
              >
                <div className="w-8 h-8 rounded-full bg-white/10"></div>
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-12 bg-white/10 rounded"></div>
              </div>
            ))
          ) : players.length > 0 ? (
            players.slice(0, 5).map((player, index) => (
              <div
                key={player.steamId}
                onClick={() => router.push(`/player/${player.steamId}`)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 cursor-pointer ${index < 3 ? 'bg-white/5' : 'bg-transparent'
                  }`}
              >
                {/* Rank */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-600/20 text-orange-400' :
                        'bg-white/5 text-white/60'
                    }`}>
                  {player.rank}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#555] flex-shrink-0">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                    }}
                  />
                </div>

                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{player.name}</div>
                  <div className="text-xs text-white/50">
                    {activeType === 'headshots' && player.headshotPercentage
                      ? `${player.headshotPercentage.toFixed(1)}% accuracy`
                      : `${player.kills}K / ${player.deaths}D`
                    }
                  </div>
                </div>

                {/* Value */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-accent-primary">
                    {formatValue(player.value, activeType)}
                  </div>
                  <div className="text-xs text-white/50">
                    {activeType === 'damage' ? 'DMG' : activeType === 'headshots' ? 'HS' : 'K'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-white/50">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
