"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowLeft, IconFlame, IconShield, IconSword, IconTarget, IconTrophy, IconBrandSteam, IconBrandFacebook, IconBrandSpotify, IconBrandTwitter, IconBrandInstagram, IconBrandGithub } from '@tabler/icons-react';
import PlayerInventory from '@/components/PlayerInventory';

type TabType = 'statistics' | 'matchHistory';

interface PlayerStats {
  steamid64: string;
  name: string;
  total_kills: string;
  total_deaths: string;
  total_damage: string;
  total_assists: string;
  total_headshots: string;
  total_5ks: string;
  total_4ks: string;
  total_3ks: string;
  total_2ks: string;
  total_1v1_wins: string;
  total_1v1_count: string;
  total_1v2_wins: string;
  total_1v2_count: string;
  total_entry_wins: string;
  total_entry_count: string;
  total_utility_damage: string;
  total_flash_successes: string;
  total_enemies_flashed: string;
  matches_played: string;
  headshot_percentage: string;
  kd_ratio: string;
  avg_kills_per_match: string;
  avg_deaths_per_match: string;
  avg_damage_per_match: string;
}

interface MatchHistory {
  matchid: number;
  start_time: string;
  end_time: string;
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

interface UserProfile {
  steamid64: string;
  name: string;
  avatar: string | null;
  avatarmedium: string | null;
  avatarfull: string | null;
  profileurl: string | null;
  facebook: string | null;
  spotify: string | null;
  twitter: string | null;
  instagram: string | null;
  github: string | null;
}

interface PlayerData {
  stats: PlayerStats;
  matchHistory: MatchHistory[];
  profile: UserProfile | null;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const steamId = params.steamId as string;
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('statistics');

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}`);
        if (!response.ok) {
          throw new Error('Player not found');
        }
        const playerData = await response.json();
        setData(playerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    if (steamId) {
      fetchPlayerData();
    }
  }, [steamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/50">Đang tải dữ liệu người chơi...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-white/50">{error || 'Không tìm thấy người chơi'}</div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-[#ff6b76] transition-colors"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  const stats = data.stats;
  const profile = data.profile;
  const avatar = profile?.avatarfull || profile?.avatarmedium || profile?.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit"
      >
        <IconArrowLeft size={20} />
        <span>Quay Lại</span>
      </button>

      <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
        <div className="flex items-stretch gap-6 max-md:flex-col">
          <img
            src={avatar}
            alt={stats.name}
            className="w-32 h-32 rounded-2xl object-cover"
          />
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{stats.name}</h1>
            <div className="flex items-center gap-4 text-sm text-white/70 mb-2">
              <span>{stats.matches_played} Trận Đã Chơi</span>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={profile?.profileurl || `https://steamcommunity.com/profiles/${steamId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-accent-primary transition-colors"
                title="Steam Profile"
              >
                <IconBrandSteam size={24} />
              </a>
              {profile?.facebook && (
                <a
                  href={profile.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1877F2] transition-colors"
                  title="Facebook"
                >
                  <IconBrandFacebook size={24} />
                </a>
              )}
              {profile?.spotify && (
                <a
                  href={profile.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1DB954] transition-colors"
                  title="Spotify"
                >
                  <IconBrandSpotify size={24} />
                </a>
              )}
              {profile?.twitter && (
                <a
                  href={profile.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#1DA1F2] transition-colors"
                  title="Twitter / X"
                >
                  <IconBrandTwitter size={24} />
                </a>
              )}
              {profile?.instagram && (
                <a
                  href={profile.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#E4405F] transition-colors"
                  title="Instagram"
                >
                  <IconBrandInstagram size={24} />
                </a>
              )}
              {profile?.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <IconBrandGithub size={24} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlayerInventory steamId={steamId} />

      <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('statistics')}
            className={`pb-3 px-4 font-semibold transition-colors relative ${
              activeTab === 'statistics'
                ? 'text-accent-primary'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Thống Kê
            {activeTab === 'statistics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('matchHistory')}
            className={`pb-3 px-4 font-semibold transition-colors relative ${
              activeTab === 'matchHistory'
                ? 'text-accent-primary'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Lịch Sử Trận Đấu
            {activeTab === 'matchHistory' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
          </button>
        </div>

        {activeTab === 'statistics' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
              <div className="bg-white/5 rounded-[20px] p-6 max-md:p-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 max-md:text-lg max-md:mb-3">
                  <IconTrophy size={24} className="text-accent-primary max-md:w-5 max-md:h-5" />
                  Thống Kê Chiến Đấu
                </h2>
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-3 max-md:gap-2">
                  <StatItem label="Giết" value={stats.total_kills} icon={<IconSword size={16} />} />
                  <StatItem label="Chết" value={stats.total_deaths} icon={<IconShield size={16} />} />
                  <StatItem label="Hỗ Trợ" value={stats.total_assists} />
                  <StatItem label="Sát Thương" value={parseInt(stats.total_damage).toLocaleString()}
                    icon={<IconFlame size={16} />} />
                  <StatItem label="Headshot" value={stats.total_headshots} icon={<IconTarget size={16} />} />
                  <StatItem label="Ace (5K)" value={stats.total_5ks} />
                  <StatItem label="4 Kills" value={stats.total_4ks} />
                  <StatItem label="3 Kills" value={stats.total_3ks} />
                </div>
              </div>

              <div className="bg-white/5 rounded-[20px] p-6 max-md:p-4">
                <h2 className="text-xl font-semibold mb-4 max-md:text-lg max-md:mb-3">Thống Kê Clutch</h2>
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-3 max-md:gap-2">
                  <StatItem
                    label="Tỷ Lệ 1v1"
                    value={`${parseInt(stats.total_1v1_count) > 0 ? ((parseInt(stats.total_1v1_wins) / parseInt(stats.total_1v1_count)) * 100).toFixed(0) : 0}%`}
                  />
                  <StatItem
                    label="Thắng 1v1"
                    value={`${stats.total_1v1_wins}/${stats.total_1v1_count}`}
                  />
                  <StatItem
                    label="Tỷ Lệ 1v2"
                    value={`${parseInt(stats.total_1v2_count) > 0 ? ((parseInt(stats.total_1v2_wins) / parseInt(stats.total_1v2_count)) * 100).toFixed(0) : 0}%`}
                  />
                  <StatItem
                    label="Thắng 1v2"
                    value={`${stats.total_1v2_wins}/${stats.total_1v2_count}`}
                  />
                  <StatItem
                    label="Tỷ Lệ Entry"
                    value={`${parseInt(stats.total_entry_count) > 0 ? ((parseInt(stats.total_entry_wins) / parseInt(stats.total_entry_count)) * 100).toFixed(0) : 0}%`}
                  />
                  <StatItem
                    label="Entry Win"
                    value={`${stats.total_entry_wins}/${stats.total_entry_count}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matchHistory' && (
          <div className="flex flex-col gap-3">
            {data.matchHistory.length > 0 ? (
              data.matchHistory.map((match) => (
                <MatchHistoryItem key={`${match.matchid}-${match.mapname}`} match={match} playerTeam={match.team} />
              ))
            ) : (
              <div className="text-center py-10 text-white/50">Không có lịch sử trận đấu</div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-white/10 rounded-xl p-3 max-md:p-2">
      <div className="text-xs text-white/50 mb-1 flex items-center gap-1 max-md:text-[10px] max-md:mb-0.5">
        {icon && <span className="max-md:hidden">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg font-bold max-md:text-sm truncate">{value}</div>
    </div>
  );
}

function MatchHistoryItem({ match, playerTeam }: { match: MatchHistory; playerTeam: string }) {
  const router = useRouter();
  const isTeam1 = playerTeam === match.team1_name;
  const playerScore = isTeam1 ? match.team1_score : match.team2_score;
  const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
  const isWinner = playerScore > opponentScore;

  return (
    <div
      onClick={() => router.push(`/matches/${match.matchid}`)}
      className={`p-4 rounded-xl cursor-pointer hover:opacity-80 transition-opacity ${isWinner ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isWinner ? 'WIN' : 'LOSS'}
            </span>
            <span className="text-sm text-white/70">{match.mapname}</span>
            <span className="text-sm text-white/50">
              {new Date(match.start_time).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm text-white/70">
            {match.team1_name} vs {match.team2_name} • {playerScore}-{opponentScore}
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div className={'w-14 text-center'}>
            <div className="text-white/50 text-xs">K/D/A</div>
            <div className="font-semibold">{match.kills}/{match.deaths}/{match.assists}</div>
          </div>
          <div className={'w-8 text-center'}>
            <div className="text-white/50 text-xs">HS</div>
            <div className="font-semibold">{match.head_shot_kills}</div>
          </div>
          <div className={'w-12 text-center'}>
            <div className="text-white/50 text-xs">DMG</div>
            <div className="font-semibold">{match.damage.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

