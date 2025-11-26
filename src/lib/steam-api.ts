import { db } from './database';
import { userInfo } from './db/schema';
import { eq } from 'drizzle-orm';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
}

export async function fetchAndCacheUserInfo(steamid64: string): Promise<SteamPlayerSummary | null> {
  try {
    const existingUser = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, steamid64))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      const lastUpdated = new Date(user.last_updated).getTime();
      const now = Date.now();

      if (now - lastUpdated < CACHE_DURATION) {
        return {
          steamid: steamid64,
          personaname: user.name,
          avatar: user.avatar || '',
          avatarmedium: user.avatarmedium || '',
          avatarfull: user.avatarfull || '',
          profileurl: user.profileurl || '',
        };
      }
    }

    if (!STEAM_API_KEY) {
      console.error('STEAM_API_KEY not configured');
      return null;
    }

    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamid64}`
    );

    if (!response.ok) {
      console.error(`Steam API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const player = data.response?.players?.[0];

    if (!player) {
      return null;
    }

    await db
      .insert(userInfo)
      .values({
        steamid64: player.steamid,
        name: player.personaname,
        avatar: player.avatar,
        avatarmedium: player.avatarmedium,
        avatarfull: player.avatarfull,
        profileurl: player.profileurl,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: player.personaname,
          avatar: player.avatar,
          avatarmedium: player.avatarmedium,
          avatarfull: player.avatarfull,
          profileurl: player.profileurl,
        },
      });

    return player;
  } catch (error) {
    console.error('Error fetching/caching user info:', error);
    return null;
  }
}

export async function fetchAndCacheMultipleUsers(steamids: string[]): Promise<Map<string, SteamPlayerSummary>> {
  const result = new Map<string, SteamPlayerSummary>();

  if (steamids.length === 0) {
    return result;
  }

  try {
    const existingUsers = await db
      .select()
      .from(userInfo);

    const now = Date.now();
    const cachedUsers = new Map<string, SteamPlayerSummary>();
    const uncachedSteamIds: string[] = [];

    for (const steamid of steamids) {
      const user = existingUsers.find((u: any) => u.steamid64 === steamid);

      if (user) {
        const lastUpdated = new Date(user.last_updated).getTime();

        if (now - lastUpdated < CACHE_DURATION) {
          cachedUsers.set(steamid, {
            steamid: steamid,
            personaname: user.name,
            avatar: user.avatar || '',
            avatarmedium: user.avatarmedium || '',
            avatarfull: user.avatarfull || '',
            profileurl: user.profileurl || '',
          });
          continue;
        }
      }

      uncachedSteamIds.push(steamid);
    }

    cachedUsers.forEach((value, key) => result.set(key, value));

    if (uncachedSteamIds.length === 0) {
      return result;
    }

    if (!STEAM_API_KEY) {
      console.error('STEAM_API_KEY not configured');
      return result;
    }

    const steamidsString = uncachedSteamIds.join(',');
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamidsString}`
    );

    if (!response.ok) {
      console.error(`Steam API error: ${response.statusText}`);
      return result;
    }

    const data = await response.json();
    const players = data.response?.players || [];

    for (const player of players) {
      const steamid = player.steamid;

      await db
        .insert(userInfo)
        .values({
          steamid64: steamid,
          name: player.personaname,
          avatar: player.avatar,
          avatarmedium: player.avatarmedium,
          avatarfull: player.avatarfull,
          profileurl: player.profileurl,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: player.personaname,
            avatar: player.avatar,
            avatarmedium: player.avatarmedium,
            avatarfull: player.avatarfull,
            profileurl: player.profileurl,
          },
        });

      result.set(steamid, player);
    }

    return result;
  } catch (error) {
    console.error('Error fetching/caching multiple users:', error);
    return result;
  }
}

