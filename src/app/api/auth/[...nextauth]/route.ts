import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import Steam from "next-auth-steam";
import { db } from "@/lib/database";
import { userInfo } from "@/lib/db/schema";

export async function GET(req: NextRequest, context: any) {
  const handler = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      Steam(req, {
        clientSecret: process.env.STEAM_API_KEY!,
        callbackUrl: process.env.NEXTAUTH_URL + '/api/auth/callback',
      }),
    ],
    callbacks: {
      async jwt({token, account, profile}) {
        if (account && profile) {
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
        }
        return token;
      },
      async session({session, token}) {
        if (session.user) {
          session.user.steamId = token.steamId as string;
          session.user.avatar = token.avatar as string;
          session.user.name = token.personaname as string;
          session.user.profileUrl = token.profileurl as string;
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
    providers: [
      Steam(req, {
        clientSecret: process.env.STEAM_API_KEY!,
        callbackUrl: process.env.NEXTAUTH_URL + '/api/auth/callback',
      }),
    ],
    callbacks: {
      async jwt({token, account, profile}) {
        if (account && profile) {
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
        }
        return token;
      },
      async session({session, token}) {
        if (session.user) {
          session.user.steamId = token.steamId as string;
          session.user.avatar = token.avatar as string;
          session.user.name = token.personaname as string;
          session.user.profileUrl = token.profileurl as string;
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
