"use client";

import React, { useEffect, useState } from 'react';
import MatchCard from './MatchCard';

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

interface LatestMatchesResponse {
  matches: Match[];
  total: number;
}

export default function LatestMatchesCard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/matches?limit=5');
        const data: LatestMatchesResponse = await response.json();
        setMatches(data.matches || []);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex justify-between items-center -mb-2.5">
        <h3 className="text-lg font-semibold">Trận Đấu Gần Đây</h3>
        <a href="/matches" className="text-text-secondary no-underline text-sm hover:text-white transition-colors">
          Xem Thêm
        </a>
      </div>
      <div className="flex flex-col gap-[15px]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-card-bg rounded-[25px] p-5 animate-pulse"
            >
              <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          ))
        ) : matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard key={match.matchid} match={match} variant="default" />
          ))
        ) : (
          <div className="bg-card-bg rounded-[25px] p-5 text-center text-text-secondary">
            Không có trận đấu
          </div>
        )}
      </div>
    </>
  );
}

