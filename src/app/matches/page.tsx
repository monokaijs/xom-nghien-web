'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import MatchCard from '@/components/MatchCard';

interface Match {
  matchid: number;
  start_time: string;
  end_time: string | null;
  winner: string;
  series_type: string;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  server_ip: string;
  maps_played: number;
  maps: any[];
  players: any[];
}

interface MatchesData {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
}

export default function MatchesPage() {
  const [data, setData] = useState<MatchesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/matches?limit=${limit}&offset=${page * limit}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching matches:', err);
        setIsLoading(false);
      });
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lịch Sử Trận Đấu</h1>
          <p className="text-neutral-300">Xem lại các trận đấu đã diễn ra</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-slate-600/50 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-600/50 rounded"></div>
                    <div className="h-4 bg-slate-600/50 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.matches.length > 0 ? (
          <>
            <div className="space-y-4">
              {data.matches.map((match) => (
                <MatchCard key={match.matchid} match={match} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
                <span className="text-white">
                  Trang {page + 1} / {totalPages}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Chưa có trận đấu nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

