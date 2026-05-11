import {DefaultSession} from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      steamId?: string;
      googleId?: string;
      discordId?: string;
      githubId?: string;
      avatar?: string;
      profileUrl?: string;
      role?: string;
      banned?: boolean;
    } & DefaultSession["user"];
  }

  interface Profile {
    steamid?: string;
    personaname?: string;
    avatar?: string;
    avatarmedium?: string;
    avatarfull?: string;
    profileurl?: string;
    sub?: string;
    id?: string;
    login?: string;
    avatar_url?: string;
    username?: string;
    discriminator?: string;
    picture?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    steamId?: string;
    googleId?: string;
    discordId?: string;
    githubId?: string;
    avatar?: string;
    personaname?: string;
    profileurl?: string;
    role?: string;
    banned?: boolean;
    provider?: string;
  }
}
