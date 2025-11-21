'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Crosshair, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface PlayerStats {
  steamid64: string;
  name: string;
  total_kills: number;
  total_deaths: number;
  total_damage: number;
  total_headshots: number;
  matches_played: number;
  headshot_percentage: number;
  kd_ratio: number;
  avg_kills_per_match: number;
}

export default function UserProfileSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/player/${user.steamid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user || isLoading) return null;

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-black/40 to-transparent">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Your Profile</h2>
          <p className="text-neutral-400">Track your performance and stats</p>
        </div>

        {stats ? (
          <>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-20 h-20 rounded-full border-4 border-white/10"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{stats.name}</h3>
                    <div className="flex items-center gap-4 text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span>{stats.matches_played} Matches</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>K/D: {stats.kd_ratio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crosshair className="w-4 h-4" />
                        <span>HS: {stats.headshot_percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/player/${user.steamid}`}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-red-400" />
                    Total Kills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.total_kills.toLocaleString()}</div>
                  <p className="text-xs text-neutral-400 mt-1">Avg: {stats.avg_kills_per_match}/match</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Total Deaths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.total_deaths.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-yellow-400" />
                    Headshots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.total_headshots.toLocaleString()}</div>
                  <p className="text-xs text-neutral-400 mt-1">{stats.headshot_percentage}% HS Rate</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Total Damage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.total_damage.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center text-neutral-400 py-12">
            No stats available yet. Play some matches to see your stats!
          </div>
        )}
      </div>
    </section>
  );
}

