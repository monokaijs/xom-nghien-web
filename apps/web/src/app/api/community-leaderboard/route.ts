import { NextResponse } from 'next/server';
import { getCommunityLeaderboard } from '@/lib/utils/community-leaderboard';
import type { CommunityLeaderboardResponse } from '@/types/community-leaderboard';
import { getLeaderboardWindow, normalizeLeaderboardPeriod } from '@/lib/utils/community-leaderboard-period';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '', 10);
    const period = normalizeLeaderboardPeriod(searchParams.get('period'));
    const window = getLeaderboardWindow(period);
    const players = await getCommunityLeaderboard(requestedLimit, period);
    const response: CommunityLeaderboardResponse = {
      players,
      period,
      window: {
        startsAt: window.startsAt?.toISOString() || null,
        endsAt: window.endsAt?.toISOString() || null,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching community leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community leaderboard' },
      { status: 500 },
    );
  }
}
