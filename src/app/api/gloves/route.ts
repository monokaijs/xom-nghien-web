import { NextRequest, NextResponse } from 'next/server';
import { CS2Glove } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';

// Cache for gloves data
let glovesCache: CS2Glove[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchGlovesData(): Promise<CS2Glove[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/gloves.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch gloves: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching gloves data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || glovesCache.length === 0) {
      console.log('Refreshing gloves cache...');
      glovesCache = await fetchGlovesData();
      lastCacheUpdate = now;
    }

    const response = NextResponse.json({
      gloves: glovesCache,
      total: glovesCache.length,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
    });

    // Set cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('Error in gloves API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gloves data' },
      { status: 500 }
    );
  }
}
