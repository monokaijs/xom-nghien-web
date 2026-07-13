"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconClock, IconMap, IconTrophy } from '@tabler/icons-react';
import { getMapImage } from '@/lib/utils/mapImage';

interface MatchMap {
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
  maps: MatchMap[];
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 20;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function MatchSummary({ match }: { match: Match }) {
  const firstMap = match.maps?.[0];
  const isTeam1Winner = match.winner === match.team1_name || match.team1_score > match.team2_score;
  const isTeam2Winner = match.winner === match.team2_name || match.team2_score > match.team1_score;

  return (
    <Link
      href={`/cs2/matches/${match.matchid}`}
      className="group relative block overflow-hidden rounded-[25px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      <div className="absolute inset-0">
        {firstMap?.mapname && (
          <img
            src={getMapImage(firstMap.mapname)}
            alt=""
            className="h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b161b]/85 to-[#1a0f12]/90" />
      </div>

      <div className="relative z-10 p-6 max-md:p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70 max-md:text-xs">
          <span className="flex items-center gap-2">
            <IconTrophy size={16} className="text-accent-primary" aria-hidden="true" />
            {match.series_type || 'Trận đấu CS2'}
          </span>
          <time dateTime={match.start_time} className="flex items-center gap-2">
            <IconClock size={16} aria-hidden="true" />
            {formatDate(match.start_time)}
          </time>
          {firstMap?.mapname && (
            <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <IconMap size={14} aria-hidden="true" />
              {firstMap.mapname.replace('de_', '').toUpperCase()}
            </span>
          )}
        </div>

        <div className="mt-4 hidden items-center justify-between gap-8 md:flex">
          <div className={`min-w-0 flex-1 truncate text-right text-lg ${isTeam1Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            {match.team1_name}
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/10 px-6 py-2 backdrop-blur-sm">
            <span className={`text-2xl font-bold ${isTeam1Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team1_score}
            </span>
            <span className="text-white/50" aria-hidden="true">–</span>
            <span className={`text-2xl font-bold ${isTeam2Winner ? 'text-accent-primary' : 'text-white/60'}`}>
              {match.team2_score}
            </span>
          </div>
          <div className={`min-w-0 flex-1 truncate text-left text-lg ${isTeam2Winner ? 'font-bold text-white' : 'text-white/60'}`}>
            {match.team2_name}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:hidden">
          {[
            { slot: 'team-1', name: match.team1_name, score: match.team1_score, won: isTeam1Winner },
            { slot: 'team-2', name: match.team2_name, score: match.team2_score, won: isTeam2Winner },
          ].map((team) => (
            <div key={team.slot} className={`flex items-center justify-between gap-3 ${team.won ? 'font-bold text-white' : 'text-white/60'}`}>
              <span className="truncate">{team.name}</span>
              <span className={`text-xl font-bold ${team.won ? 'text-accent-primary' : 'text-white/60'}`}>{team.score}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function Cs2MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * PAGE_SIZE;
        const response = await fetch(`/api/matches?limit=${PAGE_SIZE}&offset=${offset}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Không thể tải lịch sử trận đấu (${response.status})`);
        }

        const data = (await response.json()) as MatchesResponse;
        setMatches(Array.isArray(data.matches) ? data.matches : []);
        setTotal(Number(data.total) || 0);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        console.error('Error fetching matches:', fetchError);
        setMatches([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải lịch sử trận đấu');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchMatches();
    return () => controller.abort();
  }, [page, retryKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 max-sm:items-start">
        <div>
          <p className="mb-1 text-sm font-medium text-accent-primary">Counter-Strike 2</p>
          <h1 className="text-3xl font-bold max-sm:text-2xl">Lịch Sử Trận Đấu</h1>
        </div>
        <p className="text-sm text-white/50" aria-live="polite">Tổng: {total} trận</p>
      </header>

      {loading ? (
        <div className="grid gap-4" role="status" aria-label="Đang tải lịch sử trận đấu">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[25px] bg-card-bg" />
          ))}
        </div>
      ) : error ? (
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
      ) : matches.length > 0 ? (
        <>
          <div className="grid gap-4">
            {matches.map((match) => <MatchSummary key={match.matchid} match={match} />)}
          </div>

          {totalPages > 1 && (
            <nav className="mt-2 flex items-center justify-center gap-2" aria-label="Phân trang lịch sử trận đấu">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg bg-white/5 px-4 py-2 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <span className="px-3 py-2 text-sm text-white/70" aria-current="page">Trang {page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-white/5 px-4 py-2 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-[25px] bg-card-bg py-16 text-center text-white/50">Không có trận đấu</div>
      )}
    </div>
  );
}
