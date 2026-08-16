"use client";

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import MatchCard, { type MatchSummary } from './MatchCard';

interface MatchesResponse {
  matches?: MatchSummary[];
}

export default function LatestMatchesCard() {
  const headingId = useId();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches?limit=5&offset=0', { signal: controller.signal });
        if (!response.ok) throw new Error(`Matches request failed with ${response.status}`);

        const data: MatchesResponse = await response.json();
        setMatches(data.matches || []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Error fetching matches:', fetchError);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchMatches();
    return () => controller.abort();
  }, []);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId} aria-busy={loading}>
      <div className="flex items-center justify-between gap-4">
        <h3 id={headingId} className="text-lg font-semibold">Trận Đấu Gần Đây</h3>
        <Link
          href="/cs2/matches"
          className="text-sm text-text-secondary transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          Xem tất cả
        </Link>
      </div>

      {loading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Đang tải các trận đấu gần đây...</span>
          <div className="flex flex-col gap-[15px]" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[25px] bg-card-bg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[25px] border border-white/5 bg-card-bg p-8 text-center text-sm text-text-secondary" role="status">
          Chưa thể tải lịch sử trận đấu
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-[25px] border border-white/5 bg-card-bg p-8 text-center text-sm text-text-secondary" role="status">
          Chưa có trận đấu nào
        </div>
      ) : (
        <ul className="flex flex-col gap-[15px]" aria-label="Các trận đấu gần đây">
          {matches.map((match) => (
            <li key={match.matchid}>
              <MatchCard match={match} variant="default" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
