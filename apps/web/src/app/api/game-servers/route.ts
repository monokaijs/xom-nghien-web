import { NextRequest, NextResponse } from 'next/server';
import { getServersWithStatus } from '@/lib/utils/servers';

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get('game')?.trim();
  const servers = await getServersWithStatus(game);
  const response = NextResponse.json({
    servers,
  });

  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60');
  return response;
}
