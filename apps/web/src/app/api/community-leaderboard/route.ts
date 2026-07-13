import { NextResponse } from 'next/server';
import { getCommunityLeaderboard } from '@/lib/utils/community-leaderboard';
import type { CommunityLeaderboardResponse } from '@/types/community-leaderboard';

export async function GET(request: Request) {
  try {
    const requestedLimit = Number.parseInt(new URL(request.url).searchParams.get('limit') || '', 10);
    const players = await getCommunityLeaderboard(requestedLimit);
    const response: CommunityLeaderboardResponse = { players };

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
