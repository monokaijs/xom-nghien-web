"use client";

import React, { useState } from 'react';
import type { CommunityLeaderboardPlayer } from '@/types/community-leaderboard';

interface CommunityLeaderboardListProps {
  players: CommunityLeaderboardPlayer[];
  compact?: boolean;
}

function rankClasses(rank: number) {
  if (rank === 1) return 'bg-yellow-500/20 text-yellow-400';
  if (rank === 2) return 'bg-gray-400/20 text-gray-300';
  if (rank === 3) return 'bg-orange-600/20 text-orange-400';
  return 'bg-white/5 text-white/60';
}

function PlayerAvatar({ player, compact }: { player: CommunityLeaderboardPlayer; compact: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = player.name.trim().charAt(0).toLocaleUpperCase('vi-VN') || '?';
  const sizeClasses = compact ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base';

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-primary/15 font-bold text-accent-primary ${sizeClasses}`}
      aria-hidden="true"
    >
      {player.avatar && !imageFailed ? (
        <img
          src={player.avatar}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : initial}
    </span>
  );
}

export default function CommunityLeaderboardList({
  players,
  compact = false,
}: CommunityLeaderboardListProps) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Xếp hạng theo điểm cộng đồng">
      {players.map((player, index) => {
        const rank = index + 1;

        return (
          <li
            key={`${player.name}-${player.avatar || 'no-avatar'}-${index}`}
            className={`flex items-center transition-colors ${
              compact ? 'gap-3 rounded-xl p-3' : 'gap-4 rounded-xl p-4'
            } ${rank <= 3 ? 'bg-white/5' : 'bg-transparent hover:bg-white/[0.03]'}`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full font-bold ${rankClasses(rank)} ${
                compact ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'
              }`}
              aria-label={`Hạng ${rank}`}
            >
              {rank}
            </span>

            <PlayerAvatar player={player} compact={compact} />

            <span className="min-w-0 flex-1">
              <span className={`block truncate font-medium ${compact ? 'text-sm' : ''}`}>{player.name}</span>
              <span className="block text-xs text-white/50">Điểm cộng đồng</span>
            </span>

            <span className="shrink-0 text-right">
              <span className={`block font-bold text-accent-primary ${compact ? 'text-lg' : 'text-2xl'}`}>
                {player.points.toLocaleString('vi-VN')}
              </span>
              <span className="block text-xs text-white/50">điểm</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
