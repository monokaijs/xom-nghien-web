"use client";

import React, { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import Link from 'next/link';

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

interface LatestMatchesCardProps {
  initialMatches?: Match[];
}

export default function LatestMatchesCard({ initialMatches = [] }: LatestMatchesCardProps) {
  const [matches] = useState<Match[]>(initialMatches);

  return (
    <>
      <div className="flex justify-between items-center -mb-2.5">
        <h3 className="text-lg font-semibold">Trận Đấu Gần Đây</h3>
        <a href="/matches" className="text-text-secondary no-underline text-sm hover:text-white transition-colors">
          Xem Thêm
        </a>
      </div>
      <div className="flex flex-col gap-[15px]">
        {matches.length > 0 ? (
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

