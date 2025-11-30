import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/utils/leaderboard';

export async function GET() {
  try {
    const result = await getLeaderboard();

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

