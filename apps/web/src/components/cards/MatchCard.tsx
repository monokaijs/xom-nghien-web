import React from 'react';
import Link from 'next/link';
import { IconChevronRight, IconClock, IconTrophy } from '@tabler/icons-react';
import { getMapImage } from '@/lib/utils/mapImage';

export interface MatchMapSummary {
  matchid: number;
  mapnumber: number;
  mapname: string;
  team1_score: number;
  team2_score: number;
  winner: string;
}

export interface MatchSummary {
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
  maps?: MatchMapSummary[];
}

interface MatchCardProps {
  match: MatchSummary;
  variant?: 'default' | 'compact';
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  const elapsedMilliseconds = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsedMilliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MatchCard({ match, variant = 'default' }: MatchCardProps) {
  const isTeam1Winner = match.winner === match.team1_name || match.team1_score > match.team2_score;
  const isTeam2Winner = match.winner === match.team2_name || match.team2_score > match.team1_score;
  const winningTeam = isTeam1Winner ? match.team1_name : isTeam2Winner ? match.team2_name : 'Hòa';
  const firstMap = match.maps?.[0];
  const mapImage = getMapImage(firstMap?.mapname);

  if (variant === 'compact') {
    return (
      <Link
        href={`/cs2/matches/${match.matchid}`}
        className="block rounded-[25px] bg-card-bg p-5 transition-colors hover:bg-bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <IconTrophy size={20} className="flex-shrink-0 text-accent-primary" aria-hidden="true" />
            <span className="truncate text-sm text-text-secondary">{match.series_type || 'Trận đấu'}</span>
          </div>
          <time dateTime={match.start_time} className="flex flex-shrink-0 items-center gap-2 text-xs text-text-secondary">
            <IconClock size={16} aria-hidden="true" />
            {formatRelativeTime(match.start_time)}
          </time>
        </div>

        <div className="space-y-2">
          <div className={`flex items-center justify-between gap-4 ${isTeam1Winner ? 'font-semibold text-white' : 'text-text-secondary'}`}>
            <span className="truncate">{match.team1_name}</span>
            <span>{match.team1_score}</span>
          </div>
          <div className={`flex items-center justify-between gap-4 ${isTeam2Winner ? 'font-semibold text-white' : 'text-text-secondary'}`}>
            <span className="truncate">{match.team2_name}</span>
            <span>{match.team2_score}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-xs">
          <span className="text-text-secondary">Chiến thắng</span>
          <span className="truncate font-medium text-accent-primary">{winningTeam}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/cs2/matches/${match.matchid}`}
      className="group relative block overflow-hidden rounded-[25px] bg-card-bg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    >
      {mapImage && (
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={mapImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b161b]/60 to-[#1a0f12]/70" />
        </div>
      )}

      <div className="relative z-10 p-6 max-md:p-4">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2">
          <div className="flex items-center gap-4 max-md:flex-wrap max-md:gap-2">
            <div className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconTrophy size={16} className="text-accent-primary" aria-hidden="true" />
              <span>{match.series_type || 'Trận đấu'}</span>
            </div>
            <time dateTime={match.start_time} className="flex items-center gap-2 text-sm text-white/70 max-md:text-xs">
              <IconClock size={16} aria-hidden="true" />
              <span className="max-md:hidden">{formatDate(match.start_time)}</span>
              <span className="md:hidden">{formatRelativeTime(match.start_time)}</span>
            </time>
            {firstMap?.mapname && (
              <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white/80 max-md:px-2 max-md:py-0.5">
                {firstMap.mapname.replace(/^de_/, '').toUpperCase()}
              </span>
            )}
          </div>
          <IconChevronRight size={20} className="text-white/50 max-md:hidden" aria-hidden="true" />
        </div>

        <div className="mt-4 hidden items-center justify-between gap-8 md:flex">
          <div className={`min-w-0 flex-1 text-right ${isTeam1Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            <div className="truncate text-lg">{match.team1_name}</div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/10 px-6 py-2 backdrop-blur-sm">
            <span className={`text-2xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
            <span className="text-white/50" aria-hidden="true">-</span>
            <span className={`text-2xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
          <div className={`min-w-0 flex-1 text-left ${isTeam2Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            <div className="truncate text-lg">{match.team2_name}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:hidden">
          <div className={`flex items-center justify-between gap-4 ${isTeam1Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="truncate text-base">{match.team1_name}</span>
              {isTeam1Winner && <IconTrophy size={14} className="flex-shrink-0 text-accent-primary" aria-label="Đội thắng" />}
            </span>
            <span className={`text-xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
          </div>
          <div className={`flex items-center justify-between gap-4 ${isTeam2Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="truncate text-base">{match.team2_name}</span>
              {isTeam2Winner && <IconTrophy size={14} className="flex-shrink-0 text-accent-primary" aria-label="Đội thắng" />}
            </span>
            <span className={`text-xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
