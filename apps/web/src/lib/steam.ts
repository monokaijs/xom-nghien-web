export interface SteamProfile {
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

export async function fetchSteamProfile(steamId64: string): Promise<SteamProfile | null> {
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${steamId64}/?xml=1`);
    
    if (!response.ok) {
      console.error(`Failed to fetch Steam profile for ${steamId64}: ${response.statusText}`);
      return null;
    }

    const xmlText = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const getTextContent = (tagName: string): string => {
      const element = xmlDoc.getElementsByTagName(tagName)[0];
      return element?.textContent || '';
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

export function steamId64ToSteamId32(steamId64: string): number {
  const base = BigInt('76561197960265728');
  const id64 = BigInt(steamId64);
  return Number(id64 - base);
}

export function steamId32ToSteamId64(steamId32: number): string {
  const base = BigInt('76561197960265728');
  const id64 = base + BigInt(steamId32);
  return id64.toString();
}

