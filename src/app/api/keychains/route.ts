import { NextRequest, NextResponse } from 'next/server';
import { CS2Keychain } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/main/src/data';

// Cache for keychains data
let keychainsCache: CS2Keychain[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchKeychainsData(): Promise<CS2Keychain[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/keychains.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch keychains: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching keychains data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || keychainsCache.length === 0) {
      console.log('Refreshing keychains cache...');
      keychainsCache = await fetchKeychainsData();
      lastCacheUpdate = now;
    }

    const response = NextResponse.json({
      keychains: keychainsCache,
      total: keychainsCache.length,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
    });

    // Set cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error in keychains API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keychains data' },
      { status: 500 }
    );
  }
}
