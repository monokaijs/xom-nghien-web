import { NextRequest, NextResponse } from 'next/server';
import { CS2Sticker } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/main/src/data';

// Cache for stickers data
let stickersCache: CS2Sticker[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchStickersData(): Promise<CS2Sticker[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/stickers.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stickers: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stickers data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || stickersCache.length === 0) {
      console.log('Refreshing stickers cache...');
      stickersCache = await fetchStickersData();
      lastCacheUpdate = now;
    }

    const response = NextResponse.json({
      stickers: stickersCache,
      total: stickersCache.length,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
    });

    // Set cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error in stickers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stickers data' },
      { status: 500 }
    );
  }
}
