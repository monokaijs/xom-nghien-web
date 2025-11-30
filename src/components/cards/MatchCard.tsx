"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { IconTrophy, IconClock, IconChevronRight } from '@tabler/icons-react';
import Image from 'next/image';
import {getMapImage} from "@/lib/utils/mapImage";

interface Map {
  matchid: number;
  mapnumber: number;
  mapname: string;
  team1_score: number;
  team2_score: number;
  winner: string;
}

interface Match {
  matchid: number;
  start_time: string;
  end_time: string | null;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  series_type: string;
  winner: string;
  maps_played: number;
  maps?: Map[];
}

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact';
}


const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
};

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

export default function MatchCard({ match, variant = 'default' }: MatchCardProps) {
  const router = useRouter();
  const isTeam1Winner = match.winner === match.team1_name || (match.team1_score > match.team2_score);
  const isTeam2Winner = match.winner === match.team2_name || (match.team2_score > match.team1_score);
  const firstMap = match.maps && match.maps.length > 0 ? match.maps[0] : null;

  if (variant === 'compact') {
    return (
      <div
        onClick={() => router.push(`/matches/${match.matchid}`)}
        className="bg-card-bg rounded-[25px] p-5 hover:bg-bg-panel transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconTrophy size={20} className="text-accent-primary" />
            <span className="text-sm text-text-secondary">{match.series_type}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <IconClock size={16} />
            <span>{formatTime(match.start_time)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`flex items-center justify-between mb-2 ${isTeam1Winner ? 'text-white font-semibold' : 'text-text-secondary'}`}>
              <span className="truncate max-w-[150px]">{match.team1_name}</span>
              <span className="ml-2">{match.team1_score}</span>
            </div>
            <div className={`flex items-center justify-between ${!isTeam1Winner ? 'text-white font-semibold' : 'text-text-secondary'}`}>
              <span className="truncate max-w-[150px]">{match.team2_name}</span>
              <span className="ml-2">{match.team2_score}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Chiến Thắng</span>
            <span className="text-accent-primary font-medium truncate max-w-[150px]">
              {isTeam1Winner ? match.team1_name : match.team2_name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/matches/${match.matchid}`)}
      className="relative rounded-[25px] overflow-hidden transition-all duration-300 cursor-pointer group"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={getMapImage(firstMap?.mapname)}
          alt={firstMap?.mapname || 'Map'}
          fill
          className="object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b161b]/60 to-[#1a0f12]/70" />
      </div>

      <div className="relative z-10 p-6 max-md:p-4">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2">
          <div className="flex items-center gap-4 max-md:gap-2 max-md:flex-wrap">
            <div className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconTrophy size={16} className="text-accent-primary max-md:w-4 max-md:h-4" />
              <span>{match.series_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconClock size={16} className="max-md:w-4 max-md:h-4" />
              <span className="max-md:hidden">{formatDate(match.start_time)}</span>
              <span className="md:hidden">{formatTime(match.start_time)}</span>
            </div>
            {firstMap && (
              <div className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white/80 font-medium max-md:px-2 max-md:py-0.5">
                {firstMap.mapname.replace('de_', '').toUpperCase()}
              </div>
            )}
          </div>
          <IconChevronRight size={20} className="text-white/50 max-md:hidden" />
        </div>

        {/* Desktop Layout */}
        <div className="mt-4 hidden md:flex items-center justify-between gap-8">
          <div className={`flex-1 min-w-0 text-right ${isTeam1Winner ? 'text-white font-bold' : 'text-white/60'}`}>
            <div className="text-lg truncate">{match.team1_name}</div>
          </div>
          <div className="flex items-center gap-4 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
            <span className={`text-2xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
            <span className="text-white/50">-</span>
            <span className={`text-2xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
          <div className={`flex-1 min-w-0 text-left ${isTeam2Winner ? 'text-white font-bold' : 'text-white/60'}`}>
            <div className="text-lg truncate">{match.team2_name}</div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mt-3 flex flex-col gap-2 md:hidden">
          <div className={`flex items-center justify-between ${isTeam1Winner ? 'text-white font-bold' : 'text-white/60'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base truncate">{match.team1_name}</span>
              {isTeam1Winner && <IconTrophy size={14} className="text-accent-primary shrink-0" />}
            </div>
            <span className={`text-xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
          </div>
          <div className={`flex items-center justify-between ${isTeam2Winner ? 'text-white font-bold' : 'text-white/60'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base truncate">{match.team2_name}</span>
              {isTeam2Winner && <IconTrophy size={14} className="text-accent-primary shrink-0" />}
            </div>
            <span className={`text-xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

