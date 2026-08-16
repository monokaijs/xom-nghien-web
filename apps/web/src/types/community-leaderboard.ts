import type { CommunityLeaderboardPeriod } from '@/lib/utils/community-leaderboard-period';

export interface CommunityLeaderboardPlayer {
  name: string;
  avatar: string | null;
  points: number;
}

export interface CommunityLeaderboardResponse {
  players: CommunityLeaderboardPlayer[];
  period: CommunityLeaderboardPeriod;
  window: {
    startsAt: string | null;
    endsAt: string | null;
  };
}
