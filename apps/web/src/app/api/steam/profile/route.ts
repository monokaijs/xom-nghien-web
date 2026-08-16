import { NextRequest, NextResponse } from 'next/server';

interface SteamProfile {
  steamID64: string;
  steamID: string;
  onlineState: string;
  stateMessage: string;
  privacyState: string;
  visibilityState: number;
  avatarIcon: string;
  avatarMedium: string;
  avatarFull: string;
  customURL?: string;
  memberSince?: string;
  location?: string;
  realname?: string;
}

const profileCache = new Map<string, { profile: SteamProfile; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchSteamProfileServer(steamId64: string): Promise<SteamProfile | null> {
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${steamId64}/?xml=1`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch Steam profile for ${steamId64}: ${response.statusText}`);
      return null;
    }

    const xmlText = await response.text();
    
    const getTextContent = (tagName: string): string => {
      const regex = new RegExp(`<${tagName}><!\\[CDATA\\[([^\\]]*)\\]\\]></${tagName}>|<${tagName}>([^<]*)</${tagName}>`, 'i');
      const match = xmlText.match(regex);
      return match ? (match[1] || match[2] || '') : '';
    };

    const profile: SteamProfile = {
      steamID64: getTextContent('steamID64'),
      steamID: getTextContent('steamID'),
      onlineState: getTextContent('onlineState'),
      stateMessage: getTextContent('stateMessage'),
      privacyState: getTextContent('privacyState'),
      visibilityState: parseInt(getTextContent('visibilityState')) || 0,
      avatarIcon: getTextContent('avatarIcon'),
      avatarMedium: getTextContent('avatarMedium'),
      avatarFull: getTextContent('avatarFull'),
      customURL: getTextContent('customURL'),
      memberSince: getTextContent('memberSince'),
      location: getTextContent('location'),
      realname: getTextContent('realname'),
    };

    return profile;
  } catch (error) {
    console.error(`Error fetching Steam profile for ${steamId64}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamId64 = searchParams.get('steamid64');

    if (!steamId64) {
      return NextResponse.json(
        { error: 'steamid64 parameter is required' },
        { status: 400 }
      );
    }

    const cached = profileCache.get(steamId64);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.profile);
    }

    const profile = await fetchSteamProfileServer(steamId64);

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch Steam profile' },
        { status: 404 }
      );
    }

    profileCache.set(steamId64, { profile, timestamp: Date.now() });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in Steam profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steamIds } = body;

    if (!Array.isArray(steamIds) || steamIds.length === 0) {
      return NextResponse.json(
        { error: 'steamIds array is required' },
        { status: 400 }
      );
    }

    const profiles = await Promise.all(
      steamIds.map(async (steamId64: string) => {
        const cached = profileCache.get(steamId64);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return { steamId64, profile: cached.profile };
        }

        const profile = await fetchSteamProfileServer(steamId64);
        if (profile) {
          profileCache.set(steamId64, { profile, timestamp: Date.now() });
        }
        return { steamId64, profile };
      })
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error in Steam profiles batch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

