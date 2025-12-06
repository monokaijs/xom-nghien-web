import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import Steam from "next-auth-steam";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/database";
import { userInfo } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

const getProviders = (req: NextRequest) => {
  const providers: any[] = [
    Steam(req, {
      clientSecret: process.env.STEAM_API_KEY!,
      callbackUrl: process.env.NEXTAUTH_URL + '/api/auth/callback',
    }),
  ];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      })
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }

  return providers;
};

export async function GET(req: NextRequest, context: any) {
  const handler = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    providers: getProviders(req),
    callbacks: {
      async jwt({token, account, profile, user}) {
        if (account && profile) {
          token.provider = account.provider;

          if (account.provider === 'steam') {
            token.steamId = profile.steamid;
            token.avatar = profile.avatarfull || profile.avatar;
            token.personaname = profile.personaname;
            token.profileurl = profile.profileurl;

            await db
              .insert(userInfo)
              .values({
                steamid64: profile.steamid as string,
                name: profile.personaname as string,
                avatar: profile.avatar as string,
                avatarmedium: profile.avatarmedium as string,
                avatarfull: profile.avatarfull as string,
                profileurl: profile.profileurl as string,
              })
              .onDuplicateKeyUpdate({
                set: {
                  name: profile.personaname as string,
                  avatar: profile.avatar as string,
                  avatarmedium: profile.avatarmedium as string,
                  avatarfull: profile.avatarfull as string,
                  profileurl: profile.profileurl as string,
                },
              });
          } else if (account.provider === 'google') {
            token.googleId = profile.sub;
            token.avatar = profile.picture;
            token.personaname = profile.name;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.google_id, profile.sub as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `google_${profile.sub}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: profile.name as string,
                avatar: profile.picture as string,
                google_id: profile.sub as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          } else if (account.provider === 'discord') {
            token.discordId = profile.id;
            token.avatar = profile.avatar_url || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            token.personaname = profile.username;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.discord_id, profile.id as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `discord_${profile.id}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: profile.username as string,
                avatar: token.avatar as string,
                discord_id: profile.id as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          } else if (account.provider === 'github') {
            token.githubId = profile.id?.toString();
            token.avatar = profile.avatar_url;
            token.personaname = profile.name || profile.login;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.github_oauth_id, profile.id?.toString() as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `github_${profile.id}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: (profile.name || profile.login) as string,
                avatar: profile.avatar_url as string,
                github_oauth_id: profile.id?.toString() as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          }
        }

        if (token.steamId) {
          const userResult = await db
            .select()
            .from(userInfo)
            .where(eq(userInfo.steamid64, token.steamId as string))
            .limit(1);

          if (userResult.length > 0) {
            token.role = userResult[0].role || 'user';
            token.banned = userResult[0].banned === 1;
            token.googleId = userResult[0].google_id || token.googleId;
            token.discordId = userResult[0].discord_id || token.discordId;
            token.githubId = userResult[0].github_oauth_id || token.githubId;
          }
        }

        return token;
      },
      async session({session, token}) {
        if (session.user) {
          session.user.steamId = token.steamId as string;
          session.user.googleId = token.googleId as string;
          session.user.discordId = token.discordId as string;
          session.user.githubId = token.githubId as string;
          session.user.avatar = token.avatar as string;
          session.user.name = token.personaname as string;
          session.user.profileUrl = token.profileurl as string;
          session.user.role = token.role as string;
          session.user.banned = token.banned as boolean;
        }
        return session;
      },
    },
    pages: {
      signIn: '/',
    },
    debug: process.env.NODE_ENV === 'development',
  });

  return handler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  const handler = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    providers: getProviders(req),
    callbacks: {
      async jwt({token, account, profile, user}) {
        if (account && profile) {
          token.provider = account.provider;

          if (account.provider === 'steam') {
            token.steamId = profile.steamid;
            token.avatar = profile.avatarfull || profile.avatar;
            token.personaname = profile.personaname;
            token.profileurl = profile.profileurl;

            await db
              .insert(userInfo)
              .values({
                steamid64: profile.steamid as string,
                name: profile.personaname as string,
                avatar: profile.avatar as string,
                avatarmedium: profile.avatarmedium as string,
                avatarfull: profile.avatarfull as string,
                profileurl: profile.profileurl as string,
              })
              .onDuplicateKeyUpdate({
                set: {
                  name: profile.personaname as string,
                  avatar: profile.avatar as string,
                  avatarmedium: profile.avatarmedium as string,
                  avatarfull: profile.avatarfull as string,
                  profileurl: profile.profileurl as string,
                },
              });
          } else if (account.provider === 'google') {
            token.googleId = profile.sub;
            token.avatar = profile.picture;
            token.personaname = profile.name;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.google_id, profile.sub as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `google_${profile.sub}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: profile.name as string,
                avatar: profile.picture as string,
                google_id: profile.sub as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          } else if (account.provider === 'discord') {
            token.discordId = profile.id;
            token.avatar = profile.avatar_url || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            token.personaname = profile.username;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.discord_id, profile.id as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `discord_${profile.id}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: profile.username as string,
                avatar: token.avatar as string,
                discord_id: profile.id as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          } else if (account.provider === 'github') {
            token.githubId = profile.id?.toString();
            token.avatar = profile.avatar_url;
            token.personaname = profile.name || profile.login;

            const existingUser = await db
              .select()
              .from(userInfo)
              .where(eq(userInfo.github_oauth_id, profile.id?.toString() as string))
              .limit(1);

            if (existingUser.length === 0) {
              const steamId = `github_${profile.id}`;
              await db.insert(userInfo).values({
                steamid64: steamId,
                name: (profile.name || profile.login) as string,
                avatar: profile.avatar_url as string,
                github_oauth_id: profile.id?.toString() as string,
              });
              token.steamId = steamId;
            } else {
              token.steamId = existingUser[0].steamid64;
            }
          }
        }

        if (token.steamId) {
          const userResult = await db
            .select()
            .from(userInfo)
            .where(eq(userInfo.steamid64, token.steamId as string))
            .limit(1);

          if (userResult.length > 0) {
            token.role = userResult[0].role || 'user';
            token.banned = userResult[0].banned === 1;
            token.googleId = userResult[0].google_id || token.googleId;
            token.discordId = userResult[0].discord_id || token.discordId;
            token.githubId = userResult[0].github_oauth_id || token.githubId;
          }
        }

        return token;
      },
      async session({session, token}) {
        if (session.user) {
          session.user.steamId = token.steamId as string;
          session.user.googleId = token.googleId as string;
          session.user.discordId = token.discordId as string;
          session.user.githubId = token.githubId as string;
          session.user.avatar = token.avatar as string;
          session.user.name = token.personaname as string;
          session.user.profileUrl = token.profileurl as string;
          session.user.role = token.role as string;
          session.user.banned = token.banned as boolean;
        }
        return session;
      },
    },
    pages: {
      signIn: '/',
    },
    debug: process.env.NODE_ENV === 'development',
  });

  return handler(req, context);
}
