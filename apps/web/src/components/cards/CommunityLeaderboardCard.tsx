"use client";

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { IconTrophy } from '@tabler/icons-react';
import CommunityLeaderboardList from '@/components/community/CommunityLeaderboardList';
import type {
  CommunityLeaderboardPlayer,
  CommunityLeaderboardResponse,
} from '@/types/community-leaderboard';

interface CommunityLeaderboardCardProps {
  title?: string;
}

export default function CommunityLeaderboardCard({
  title = 'Bảng Xếp Hạng',
}: CommunityLeaderboardCardProps) {
  const headingId = useId();
  const [players, setPlayers] = useState<CommunityLeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/community-leaderboard?limit=5', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Community leaderboard request failed with ${response.status}`);
        }

        const result = await response.json() as CommunityLeaderboardResponse;
        setPlayers(result.players || []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Error fetching community leaderboard:', fetchError);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchLeaderboard();
    return () => controller.abort();
  }, []);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id={headingId} className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-text-secondary">Xếp hạng người chơi theo điểm cộng đồng.</p>
        </div>
        <Link
          href="/leaderboard"
          className="shrink-0 text-sm text-text-secondary transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          Xem tất cả
        </Link>
      </div>

      <div
        className="flex flex-col rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-5"
        aria-busy={loading}
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary">
            <IconTrophy size={17} aria-hidden="true" />
          </span>
          Điểm người chơi
        </div>

        {loading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="Đang tải bảng xếp hạng">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-white/5" aria-hidden="true" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50" role="status">
            Chưa thể tải bảng xếp hạng
          </p>
        ) : players.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50" role="status">
            Chưa có người chơi trong bảng xếp hạng
          </p>
        ) : (
          <CommunityLeaderboardList players={players} compact />
        )}
      </div>
    </section>
  );
}
