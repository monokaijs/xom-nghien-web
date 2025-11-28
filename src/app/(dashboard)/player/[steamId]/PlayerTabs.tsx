"use client";

import React, {useState} from 'react';
import {IconFlame, IconShield, IconSword, IconTarget, IconTrophy} from '@tabler/icons-react';

type TabType = 'statistics' | 'matchHistory';

interface PlayerStats {
  steamid64: string;
  name: string;
  matches_played: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_damage: number;
  total_headshots: number;
  total_5ks: number;
  total_4ks: number;
  total_3ks: number;
  total_v1_count: number;
  total_v1_wins: number;
  total_entry_count: number;
  total_entry_wins: number;
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

interface PlayerTabsProps {
  stats: PlayerStats;
  matchHistory: MatchHistory[];
}

function StatItem({label, value, icon}: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-white/50 flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold max-md:text-base">{value}</div>
    </div>
  );
}

function MatchHistoryItem({match, playerTeam}: { match: MatchHistory; playerTeam: string }) {
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

  const isPlayerTeam1 = playerTeam === match.team1_name;
  const isPlayerTeam2 = playerTeam === match.team2_name;
  const playerWon = (isPlayerTeam1 && match.winner === match.team1_name) ||
    (isPlayerTeam2 && match.winner === match.team2_name);

  return (
    <a
      href={`/matches/${match.matchid}`}
      className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors block"
    >
      <div className="flex items-center justify-between gap-4 mb-3 max-md:flex-col max-md:items-start max-md:gap-2">
        <div className="flex items-center gap-3 max-md:w-full max-md:justify-between">
          <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            playerWon ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {playerWon ? 'Thắng' : 'Thua'}
          </div>
          <div className="text-sm text-white/50">{formatDate(match.start_time)}</div>
        </div>
        <div className="text-sm text-white/70 max-md:w-full">{match.mapname}</div>
      </div>
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:gap-3">
        <div className="flex items-center gap-4 flex-1 max-md:w-full max-md:justify-between">
          <div className={`font-semibold ${isPlayerTeam1 ? 'text-accent-primary' : 'text-white/70'}`}>
            {match.team1_name}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${match.team1_score > match.team2_score ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
            <span className="text-white/50">-</span>
            <span className={`text-xl font-bold ${match.team2_score > match.team1_score ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
          <div className={`font-semibold ${isPlayerTeam2 ? 'text-accent-primary' : 'text-white/70'}`}>
            {match.team2_name}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm max-md:w-full max-md:justify-between">
          <div className="text-white/70">K/D/A: <span className="text-white font-medium">{match.kills}/{match.deaths}/{match.assists}</span></div>
          <div className="text-white/70">DMG: <span className="text-white font-medium">{match.damage.toLocaleString()}</span></div>
        </div>
      </div>
    </a>
  );
}

export default function PlayerTabs({stats, matchHistory}: PlayerTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');

  return (
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
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"/>
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
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"/>
          )}
        </button>
      </div>

      {activeTab === 'statistics' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            <div className="bg-white/5 rounded-[20px] p-6 max-md:p-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 max-md:text-lg max-md:mb-3">
                <IconTrophy size={24} className="text-accent-primary max-md:w-5 max-md:h-5"/>
                Thống Kê Chiến Đấu
              </h2>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-3 max-md:gap-2">
                <StatItem label="Giết" value={stats.total_kills} icon={<IconSword size={16}/>}/>
                <StatItem label="Chết" value={stats.total_deaths} icon={<IconShield size={16}/>}/>
                <StatItem label="Hỗ Trợ" value={stats.total_assists}/>
                <StatItem label="Sát Thương" value={parseInt(stats.total_damage.toString()).toLocaleString()}
                          icon={<IconFlame size={16}/>}/>
                <StatItem label="Headshot" value={stats.total_headshots} icon={<IconTarget size={16}/>}/>
                <StatItem label="Ace (5K)" value={stats.total_5ks}/>
                <StatItem label="4 Kills" value={stats.total_4ks}/>
                <StatItem label="3 Kills" value={stats.total_3ks}/>
              </div>
            </div>

            <div className="bg-white/5 rounded-[20px] p-6 max-md:p-4">
              <h2 className="text-xl font-semibold mb-4 max-md:text-lg max-md:mb-3">Thống Kê Clutch</h2>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-3 max-md:gap-2">
                <StatItem
                  label="Tỷ Lệ 1v1"
                  value={`${parseInt(stats.total_v1_count.toString()) > 0 ? ((parseInt(stats.total_v1_wins.toString()) / parseInt(stats.total_v1_count.toString())) * 100).toFixed(0) : 0}%`}
                />
                <StatItem
                  label="Thắng 1v1"
                  value={`${stats.total_v1_wins}/${stats.total_v1_count}`}
                />
                <StatItem
                  label="Tỷ Lệ Entry"
                  value={`${parseInt(stats.total_entry_count.toString()) > 0 ? ((parseInt(stats.total_entry_wins.toString()) / parseInt(stats.total_entry_count.toString())) * 100).toFixed(0) : 0}%`}
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
          {matchHistory.length > 0 ? (
            matchHistory.map((match) => (
              <MatchHistoryItem key={`${match.matchid}-${match.mapname}`} match={match} playerTeam={match.team}/>
            ))
          ) : (
            <div className="text-center py-10 text-white/50">Không có lịch sử trận đấu</div>
          )}
        </div>
      )}
    </div>
  );
}

