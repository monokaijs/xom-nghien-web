import { db } from './database';
import { userInfo } from './db/schema';
import { eq, inArray } from 'drizzle-orm';

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
    // Only fetch users we need instead of all users
    const existingUsers = await db
      .select()
      .from(userInfo)
      .where(inArray(userInfo.steamid64, steamids));

    const now = Date.now();
    const uncachedSteamIds: string[] = [];

    for (const steamid of steamids) {
      const user = existingUsers.find((u: any) => u.steamid64 === steamid);

      if (user) {
        const lastUpdated = new Date(user.last_updated).getTime();

        if (now - lastUpdated < CACHE_DURATION) {
          result.set(steamid, {
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

    // Batch insert/update all players at once
    if (players.length > 0) {
      await Promise.all(
        players.map((player: any) =>
          db
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
            })
        )
      );

      for (const player of players) {
        result.set(player.steamid, player);
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching/caching multiple users:', error);
    return result;
  }
}

