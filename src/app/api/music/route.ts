import { NextRequest, NextResponse } from 'next/server';
import { CS2Music } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';

// Cache for music data
let musicCache: CS2Music[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchMusicData(): Promise<CS2Music[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/music.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch music: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching music data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || musicCache.length === 0) {
      console.log('Refreshing music cache...');
      musicCache = await fetchMusicData();
      lastCacheUpdate = now;
    }

    const response = NextResponse.json({
      music: musicCache,
      total: musicCache.length,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
    });

    // Set cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('Error in music API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music data' },
      { status: 500 }
    );
  }
}
