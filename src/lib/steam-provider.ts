import type {OAuthConfig} from "next-auth/providers/oauth";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export interface SteamProfile extends Record<string, any> {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

export function getSteamProvider(req: NextRequest): OAuthConfig<SteamProfile> {
  return {
    id: "steam",
    name: "Steam",
    type: "oauth",
    authorization: {
      url: "https://steamcommunity.com/openid/login",
      params: {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
        "openid.realm": process.env.NEXTAUTH_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      },
    },
    token: {
      async request(context: any) {
        const url = new URL(req.url);
        const query = url.searchParams;

        const claimedId = query.get("openid.claimed_id");

        if (!claimedId) {
          throw new Error("No Steam ID found in callback");
        }

        const tokenParams: Record<string, any> = {
          "openid.assoc_handle": query.get("openid.assoc_handle"),
          "openid.signed": query.get("openid.signed"),
          "openid.sig": query.get("openid.sig"),
          "openid.ns": "http://specs.openid.net/auth/2.0",
          "openid.mode": "check_authentication",
        };

        const signedParams = query.get("openid.signed")?.split(",") || [];
        for (const param of signedParams) {
          tokenParams[`openid.${param}`] = query.get(`openid.${param}`);
        }

        const tokenUrlParams = new URLSearchParams(tokenParams);
        const tokenRes = await fetch("https://steamcommunity.com/openid/login", {
          method: "POST",
          headers: {
            "Accept-language": "en\r\n",
            "Content-type": "application/x-www-form-urlencoded\r\n",
            "Content-Length": `${tokenUrlParams.toString().length}\r\n`,
          },
          body: tokenUrlParams.toString(),
        });

        const result = await tokenRes.text();

        if (!result.match(/is_valid\s*:\s*true/i)) {
          throw new Error("Steam authentication validation failed");
        }

        const matches = claimedId.match(/^https:\/\/steamcommunity.com\/openid\/id\/([0-9]{17,25})/);
        const steamid = matches?.[1];

        if (!steamid) {
          throw new Error("Invalid Steam ID format");
        }

        const apiKey = process.env.STEAM_API_KEY;
        if (!apiKey) {
          throw new Error("STEAM_API_KEY not configured");
        }

        const userResult = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamid}`
        );

        if (!userResult.ok) {
          throw new Error("Failed to fetch Steam profile");
        }

        const userData = await userResult.json();
        const player = userData.response?.players?.[0];

        if (!player) {
          throw new Error("Steam player not found");
        }

        return {
          tokens: {
            id_token: uuidv4(),
            access_token: steamid,
            steamid: steamid,
          } as any,
        };
      },
    },
    userinfo: {
      async request(context: any) {
        const steamid = context.tokens.access_token;

        if (!steamid) {
          throw new Error("No Steam ID in token");
        }

        const apiKey = process.env.STEAM_API_KEY;
        const userResult = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamid}`
        );

        const userData = await userResult.json();
        const player = userData.response?.players?.[0];

        if (!player) {
          throw new Error("Steam player not found in userinfo");
        }

        return player;
      },
    },
    idToken: false,
    checks: ["none"],
    profile(profile: any) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: null,
        image: profile.avatarfull,
      };
    },
    style: {
      logo: "/steam-logo.svg",
      logoDark: "/steam-logo.svg",
      bg: "#000",
      text: "#fff",
      bgDark: "#000",
      textDark: "#fff",
    },
    clientId: "steam",
    clientSecret: process.env.STEAM_API_KEY!,
  };
}
