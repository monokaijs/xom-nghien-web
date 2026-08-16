export type CommunityLeaderboardPeriod = 'week' | 'month' | 'all';

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface LeaderboardWindow {
  startsAt: Date | null;
  endsAt: Date | null;
}

export function normalizeLeaderboardPeriod(value: string | null | undefined): CommunityLeaderboardPeriod {
  return value === 'week' || value === 'month' ? value : 'all';
}

export function getLeaderboardWindow(
  period: CommunityLeaderboardPeriod,
  now = new Date(),
): LeaderboardWindow {
  if (period === 'all') return { startsAt: null, endsAt: null };

  const bangkok = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const year = bangkok.getUTCFullYear();
  const month = bangkok.getUTCMonth();
  const day = bangkok.getUTCDate();
  let localStartMs: number;
  let localEndMs: number;

  if (period === 'month') {
    localStartMs = Date.UTC(year, month, 1);
    localEndMs = Date.UTC(year, month + 1, 1);
  } else {
    const daysSinceMonday = (bangkok.getUTCDay() + 6) % 7;
    localStartMs = Date.UTC(year, month, day - daysSinceMonday);
    localEndMs = localStartMs + 7 * 24 * 60 * 60 * 1000;
  }

  return {
    startsAt: new Date(localStartMs - BANGKOK_OFFSET_MS),
    endsAt: new Date(localEndMs - BANGKOK_OFFSET_MS),
  };
}
