import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { searchThunderstoreMods } from '@/lib/thunderstore';

export const dynamic = 'force-dynamic';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const game = request.nextUrl.searchParams.get('game') || '';
    const query = request.nextUrl.searchParams.get('q') || '';
    const mods = await searchThunderstoreMods(game, query);
    return NextResponse.json({ mods });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search mods';
    const status = message === 'The mod catalog is temporarily unavailable' ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
});
