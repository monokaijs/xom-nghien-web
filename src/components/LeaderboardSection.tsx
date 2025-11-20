'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Crosshair } from 'lucide-react';

interface LeaderboardPlayer {
  steamid64: string;
  name: string;
  total_kills?: number;
  total_deaths?: number;
  total_damage?: number;
  total_headshots?: number;
  matches_played?: number;
  headshot_percentage?: number;
  avatar?: string;
}

interface LeaderboardData {
  topKillers: LeaderboardPlayer[];
  topDamage: LeaderboardPlayer[];
  topHeadshot: LeaderboardPlayer[];
}

export default function LeaderboardSection() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardWithAvatars = async () => {
      try {
        const leaderboardRes = await fetch('/api/leaderboard');
        const leaderboardData = await leaderboardRes.json();

        const allPlayers = [
          ...leaderboardData.topKillers,
          ...leaderboardData.topDamage,
          ...leaderboardData.topHeadshot,
        ];
        const uniqueSteamIds = [...new Set(allPlayers.map((p: LeaderboardPlayer) => p.steamid64))];

        const profilesRes = await fetch('/api/steam/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steamIds: uniqueSteamIds }),
        });
        const { profiles } = await profilesRes.json();

        const avatarMap = new Map(
          profiles.map((p: any) => [p.steamId64, p.profile?.avatarMedium || ''])
        );

        const addAvatars = (players: LeaderboardPlayer[]) =>
          players.map((player) => ({
            ...player,
            avatar: avatarMap.get(player.steamid64) || '',
          }));

        setData({
          topKillers: addAvatars(leaderboardData.topKillers),
          topDamage: addAvatars(leaderboardData.topDamage),
          topHeadshot: addAvatars(leaderboardData.topHeadshot),
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setIsLoading(false);
      }
    };

    fetchLeaderboardWithAvatars();
  }, []);

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Bảng Xếp Hạng</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-slate-600/50 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-600/50 rounded"></div>
                    <div className="h-4 bg-slate-600/50 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const renderLeaderboard = (
    title: string,
    players: LeaderboardPlayer[],
    icon: React.ReactNode,
    statKey: 'total_kills' | 'total_damage' | 'total_headshots',
    statLabel: string
  ) => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.slice(0, 5).map((player, index) => (
            <Link
              key={player.steamid64}
              href={`/player/${player.steamid64}`}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-full border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-400 text-gray-900'
                        : index === 2
                        ? 'bg-orange-600 text-orange-900'
                        : 'bg-white/20 text-white/80'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium">{player.name}</div>
                  <div className="text-xs text-slate-400">
                    {player.matches_played} trận
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {player[statKey]?.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">{statLabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-12 px-4 bg-black/20">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <span className="text-slate-400 text-sm font-medium">Thống kê</span>
          <h2 className="text-3xl font-bold text-white mt-2">Bảng Xếp Hạng</h2>
          <p className="text-neutral-300 mt-2">Top người chơi xuất sắc nhất</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderLeaderboard(
            'Top Sát Thủ',
            data.topKillers,
            <Trophy className="w-5 h-5 text-red-400" />,
            'total_kills',
            'kills'
          )}
          {renderLeaderboard(
            'Top Sát Thương',
            data.topDamage,
            <Target className="w-5 h-5 text-orange-400" />,
            'total_damage',
            'damage'
          )}
          {renderLeaderboard(
            'Top Headshot',
            data.topHeadshot,
            <Crosshair className="w-5 h-5 text-yellow-400" />,
            'total_headshots',
            'headshots'
          )}
        </div>
      </div>
    </section>
  );
}

