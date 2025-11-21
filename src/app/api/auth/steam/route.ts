import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  console.log('authenticating');

  // If this is a callback from Steam
  if (searchParams.has('openid.mode')) {
    console.log(searchParams)
    try {
      // Verify the OpenID response
      const isValid = await verifyOpenIDResponse(searchParams, baseUrl);

      if (isValid) {
        const steamId = extractSteamId(searchParams.get('openid.identity') || '');

        if (steamId) {
          // Fetch user info from Steam API
          const userInfo = await fetchSteamUserInfo(steamId);

          if (userInfo) {
            // Create session
            await createSession({
              steamid: steamId,
              username: userInfo.personaname,
              avatar: userInfo.avatarfull,
              profileurl: userInfo.profileurl,
            });

            return NextResponse.redirect(new URL('/', baseUrl));
          }
        }
      }

      return NextResponse.redirect(new URL('/?error=auth_failed', baseUrl));
    } catch (error) {
      console.error('Steam auth error:', error);
      return NextResponse.redirect(new URL('/?error=auth_error', baseUrl));
    }
  }

  // Initial Steam OpenID request
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${baseUrl}/api/auth/steam`,
    'openid.realm': baseUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}

async function verifyOpenIDResponse(params: URLSearchParams, baseUrl: string): Promise<boolean> {
  const verifyParams = new URLSearchParams();

  for (const [key, value] of params.entries()) {
    if (key.startsWith('openid.')) {
      verifyParams.append(key, value);
    }
  }

  verifyParams.set('openid.mode', 'check_authentication');

  try {
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    const text = await response.text();
    return text.includes('is_valid:true');
  } catch (error) {
    console.error('OpenID verification error:', error);
    return false;
  }
}

function extractSteamId(identity: string): string | null {
  const match = identity.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}

async function fetchSteamUserInfo(steamId: string) {
  if (!STEAM_API_KEY) {
    console.error('STEAM_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
    );

    const data = await response.json();
    return data.response?.players?.[0] || null;
  } catch (error) {
    console.error('Steam API error:', error);
    return null;
  }
}
