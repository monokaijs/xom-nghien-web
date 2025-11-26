"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MatchCard from '@/components/cards/MatchCard';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

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
  maps: Map[];
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        const response = await fetch(`/api/matches?limit=${limit}&offset=${offset}`);
        const data: MatchesResponse = await response.json();
        setMatches(data.matches);
        setTotal(data.total);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="max-md:p-5 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lịch Sử Trận Đấu</h1>
          <div className="text-white/50">Tổng: {total} trận</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Đang tải...</div>
          </div>
        ) : matches.length > 0 ? (
          <>
            <div className="grid gap-4">
              {matches.map((match) => (
                <MatchCard key={match.matchid} match={match} variant="default" />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-white/70">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-white/50">Không có trận đấu</div>
        )}
      </div>
    </DashboardLayout>
  );
}

