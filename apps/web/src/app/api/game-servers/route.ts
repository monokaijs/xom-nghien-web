import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getServersWithStatus } from '@/lib/utils/servers';

const getCachedServers = unstable_cache(
  () => getServersWithStatus(),
  ['public-game-servers'],
  { revalidate: 60 },
);

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get('game')?.trim();
  const servers = await getCachedServers();
  const response = NextResponse.json({
    servers: game ? servers.filter((server) => server.game === game) : servers,
  });

  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  return response;
}
