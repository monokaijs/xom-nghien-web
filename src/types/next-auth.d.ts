import {DefaultSession} from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      steamId?: string;
      avatar?: string;
      profileUrl?: string;
    } & DefaultSession["user"];
  }

  interface Profile {
    steamid?: string;
    personaname?: string;
    avatar?: string;
    avatarmedium?: string;
    avatarfull?: string;
    profileurl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    steamId?: string;
    avatar?: string;
    personaname?: string;
    profileurl?: string;
  }
}
