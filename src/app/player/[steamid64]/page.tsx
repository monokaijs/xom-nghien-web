'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Crosshair, TrendingUp, Award, Zap, Calendar } from 'lucide-react';

interface PlayerStats {
  steamid64: string;
  name: string;
  total_kills: number;
  total_deaths: number;
  total_damage: number;
  total_assists: number;
  total_headshots: number;
  total_5ks: number;
  total_4ks: number;
  total_3ks: number;
  total_2ks: number;
  total_1v1_wins: number;
  total_1v1_count: number;
  total_1v2_wins: number;
  total_1v2_count: number;
  total_entry_wins: number;
  total_entry_count: number;
  total_utility_damage: number;
  total_flash_successes: number;
  total_enemies_flashed: number;
  matches_played: number;
  headshot_percentage: number;
  kd_ratio: number;
  avg_kills_per_match: number;
  avg_deaths_per_match: number;
  avg_damage_per_match: number;
}

interface MatchHistory {
  matchid: number;
  start_time: string;
  end_time: string | null;
  winner: string;
  series_type: string;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  team: string;
  kills: number;
  deaths: number;
  damage: number;
  assists: number;
  head_shot_kills: number;
  mapname: string;
}

interface PlayerProfile {
  steamid64: string;
  name: string;
  avatar: string | null;
  avatarmedium: string | null;
  avatarfull: string | null;
  profileurl: string | null;
}

interface PlayerData {
  stats: PlayerStats;
  matchHistory: MatchHistory[];
  profile: PlayerProfile | null;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const steamid64 = params.steamid64 as string;
  const [data, setData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!steamid64) return;

    setIsLoading(true);
    fetch(`/api/player/${steamid64}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching player data:', err);
        setIsLoading(false);
      });
  }, [steamid64]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-neutral-400 py-12">Loading player profile...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-neutral-400 py-12">Player not found</div>
        </div>
      </div>
    );
  }

  const { stats, matchHistory, profile } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {profile?.avatarfull ? (
                <img
                  src={profile.avatarfull}
                  alt={stats.name}
                  className="w-24 h-24 rounded-full border-4 border-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-4 border-white/10">
                  <span className="text-white text-3xl font-bold">
                    {stats.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{stats.name}</h1>
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
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red-400" />
                Total Kills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total_kills.toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-1">Avg: {stats.avg_kills_per_match}/match</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Total Damage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total_damage.toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-1">Avg: {stats.avg_damage_per_match}/match</p>
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
              <div className="text-3xl font-bold text-white">{stats.total_headshots.toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-1">{stats.headshot_percentage}% accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                K/D Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.kd_ratio}</div>
              <p className="text-xs text-neutral-400 mt-1">{stats.total_kills}K / {stats.total_deaths}D</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Multi-Kills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">Ace (5K)</span>
                  <span className="text-white font-bold">{stats.total_5ks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">Quad Kill (4K)</span>
                  <span className="text-white font-bold">{stats.total_4ks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">Triple Kill (3K)</span>
                  <span className="text-white font-bold">{stats.total_3ks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">Double Kill (2K)</span>
                  <span className="text-white font-bold">{stats.total_2ks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                Clutch Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">1v1 Clutches</span>
                  <span className="text-white font-bold">
                    {stats.total_1v1_wins} / {stats.total_1v1_count}
                    {stats.total_1v1_count > 0 && (
                      <span className="text-xs text-neutral-400 ml-2">
                        ({((stats.total_1v1_wins / stats.total_1v1_count) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">1v2 Clutches</span>
                  <span className="text-white font-bold">
                    {stats.total_1v2_wins} / {stats.total_1v2_count}
                    {stats.total_1v2_count > 0 && (
                      <span className="text-xs text-neutral-400 ml-2">
                        ({((stats.total_1v2_wins / stats.total_1v2_count) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral-300">Entry Frags</span>
                  <span className="text-white font-bold">
                    {stats.total_entry_wins} / {stats.total_entry_count}
                    {stats.total_entry_count > 0 && (
                      <span className="text-xs text-neutral-400 ml-2">
                        ({((stats.total_entry_wins / stats.total_entry_count) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Match History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchHistory.length === 0 ? (
              <div className="text-center text-neutral-400 py-8">No match history found</div>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((match) => {
                  const playerTeam = match.team;
                  const isTeam1 = playerTeam === match.team1_name;
                  const playerTeamScore = isTeam1 ? match.team1_score : match.team2_score;
                  const opponentTeamScore = isTeam1 ? match.team2_score : match.team1_score;
                  const won = match.winner === playerTeam;

                  return (
                    <div
                      key={`${match.matchid}-${match.mapname}`}
                      className={`p-4 rounded-lg border ${
                        won
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`px-3 py-1 rounded text-sm font-bold ${
                              won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {won ? 'WIN' : 'LOSS'}
                          </div>
                          <div className="text-white font-medium">
                            {playerTeamScore} - {opponentTeamScore}
                          </div>
                          <div className="text-neutral-400 text-sm">{match.mapname}</div>
                        </div>
                        <div className="text-neutral-400 text-sm">{formatDate(match.start_time)}</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-neutral-400">K/D/A</div>
                          <div className="text-white font-medium">
                            {match.kills}/{match.deaths}/{match.assists}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-400">Damage</div>
                          <div className="text-white font-medium">{match.damage}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">Headshots</div>
                          <div className="text-white font-medium">{match.head_shot_kills}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">K/D</div>
                          <div className="text-white font-medium">
                            {match.deaths > 0 ? (match.kills / match.deaths).toFixed(2) : match.kills.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-400">HS%</div>
                          <div className="text-white font-medium">
                            {match.kills > 0 ? ((match.head_shot_kills / match.kills) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

