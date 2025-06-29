import { CS2Skin, CS2Agent, CS2Sticker, CS2Keychain, CS2Glove, CS2Music } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';

// Cache for client-side data
let skinsCache: CS2Skin[] = [];
let agentsCache: CS2Agent[] = [];
let stickersCache: CS2Sticker[] = [];
let keychainsCache: CS2Keychain[] = [];
let glovesCache: CS2Glove[] = [];
let musicCache: CS2Music[] = [];

let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CacheStatus {
  lastUpdated: number;
  isValid: boolean;
}

function getCacheStatus(): CacheStatus {
  const now = Date.now();
  const isValid = now - lastCacheUpdate < CACHE_DURATION;
  return {
    lastUpdated: lastCacheUpdate,
    isValid
  };
}

export async function fetchSkinsData(forceRefresh = false): Promise<CS2Skin[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && skinsCache.length > 0) {
    return skinsCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/skins.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch skins: ${response.statusText}`);
    }

    skinsCache = await response.json();
    lastCacheUpdate = Date.now();
    return skinsCache;
  } catch (error) {
    console.error('Error fetching skins data from GitHub:', error);

    // If we have cached data, return it
    if (skinsCache.length > 0) {
      console.log('Returning cached skins data due to fetch error');
      return skinsCache;
    }

    // If no cached data and GitHub fails, try fallback to API
    try {
      console.log('Attempting fallback to API for skins data');
      const fallbackResponse = await fetch('/api/skins');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData.categories ? Object.values(fallbackData.categories).flat() : [];
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    return [];
  }
}

export async function fetchAgentsData(forceRefresh = false): Promise<CS2Agent[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && agentsCache.length > 0) {
    return agentsCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/agents.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }

    agentsCache = await response.json();
    lastCacheUpdate = Date.now();
    return agentsCache;
  } catch (error) {
    console.error('Error fetching agents data from GitHub:', error);

    // If we have cached data, return it
    if (agentsCache.length > 0) {
      console.log('Returning cached agents data due to fetch error');
      return agentsCache;
    }

    // If no cached data and GitHub fails, try fallback to API
    try {
      console.log('Attempting fallback to API for agents data');
      const fallbackResponse = await fetch('/api/agents');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return [...(fallbackData.terrorist || []), ...(fallbackData.counterTerrorist || [])];
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    return [];
  }
}

export async function fetchStickersData(forceRefresh = false): Promise<CS2Sticker[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && stickersCache.length > 0) {
    return stickersCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/stickers.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stickers: ${response.statusText}`);
    }

    stickersCache = await response.json();
    lastCacheUpdate = Date.now();
    return stickersCache;
  } catch (error) {
    console.error('Error fetching stickers data from GitHub:', error);

    // If we have cached data, return it
    if (stickersCache.length > 0) {
      console.log('Returning cached stickers data due to fetch error');
      return stickersCache;
    }

    // If no cached data and GitHub fails, try fallback to API
    try {
      console.log('Attempting fallback to API for stickers data');
      const fallbackResponse = await fetch('/api/stickers');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData.stickers || [];
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    return [];
  }
}

export async function fetchKeychainsData(forceRefresh = false): Promise<CS2Keychain[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && keychainsCache.length > 0) {
    return keychainsCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/keychains.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch keychains: ${response.statusText}`);
    }

    keychainsCache = await response.json();
    lastCacheUpdate = Date.now();
    return keychainsCache;
  } catch (error) {
    console.error('Error fetching keychains data from GitHub:', error);

    // If we have cached data, return it
    if (keychainsCache.length > 0) {
      console.log('Returning cached keychains data due to fetch error');
      return keychainsCache;
    }

    // If no cached data and GitHub fails, try fallback to API
    try {
      console.log('Attempting fallback to API for keychains data');
      const fallbackResponse = await fetch('/api/keychains');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData.keychains || [];
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    return [];
  }
}

export async function fetchGlovesData(forceRefresh = false): Promise<CS2Glove[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && glovesCache.length > 0) {
    return glovesCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/gloves.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gloves: ${response.statusText}`);
    }

    glovesCache = await response.json();
    lastCacheUpdate = Date.now();
    return glovesCache;
  } catch (error) {
    console.error('Error fetching gloves data from GitHub:', error);

    // If we have cached data, return it
    if (glovesCache.length > 0) {
      console.log('Returning cached gloves data due to fetch error');
      return glovesCache;
    }

    // If no cached data and GitHub fails, try fallback to API
    try {
      console.log('Attempting fallback to API for gloves data');
      const fallbackResponse = await fetch('/api/gloves');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData.gloves || [];
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    return [];
  }
}

export async function fetchMusicData(forceRefresh = false): Promise<CS2Music[]> {
  const cacheStatus = getCacheStatus();

  if (!forceRefresh && cacheStatus.isValid && musicCache.length > 0) {
    return musicCache;
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/music.json`, {
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch music: ${response.statusText}`);
    }

    musicCache = await response.json();
    lastCacheUpdate = Date.now();
    return musicCache;
  } catch (error) {
    console.error('Error fetching music data from GitHub:', error);
    return musicCache;
  }
}

// Utility function to categorize weapons (moved from API)
export function categorizeWeapons(skins: CS2Skin[]) {
  const weaponCategories: Record<string, string> = {
    // Pistols
    'weapon_deagle': 'pistols',
    'weapon_elite': 'pistols',
    'weapon_fiveseven': 'pistols',
    'weapon_glock': 'pistols',
    'weapon_hkp2000': 'pistols',
    'weapon_p250': 'pistols',
    'weapon_usp_silencer': 'pistols',
    'weapon_cz75a': 'pistols',
    'weapon_revolver': 'pistols',
    'weapon_tec9': 'pistols',

    // Rifles
    'weapon_ak47': 'rifles',
    'weapon_m4a1': 'rifles',
    'weapon_m4a1_silencer': 'rifles',
    'weapon_aug': 'rifles',
    'weapon_sg556': 'rifles',
    'weapon_famas': 'rifles',
    'weapon_galilar': 'rifles',

    // SMGs
    'weapon_mp7': 'smg',
    'weapon_mp9': 'smg',
    'weapon_bizon': 'smg',
    'weapon_mac10': 'smg',
    'weapon_ump45': 'smg',
    'weapon_p90': 'smg',
    'weapon_mp5sd': 'smg',

    // Shotguns
    'weapon_nova': 'shotguns',
    'weapon_xm1014': 'shotguns',
    'weapon_sawedoff': 'shotguns',
    'weapon_mag7': 'shotguns',

    // Snipers
    'weapon_awp': 'snipers',
    'weapon_ssg08': 'snipers',
    'weapon_scar20': 'snipers',
    'weapon_g3sg1': 'snipers',

    // Machine Guns
    'weapon_m249': 'machineguns',
    'weapon_negev': 'machineguns',
  };

  const categorized: Record<string, CS2Skin[]> = {
    pistols: [],
    rifles: [],
    smg: [],
    shotguns: [],
    snipers: [],
    machineguns: [],
    knifes: [],
    gloves: []
  };

  skins.forEach(skin => {
    if (skin.weapon_name.includes('knife')) {
      categorized.knifes.push(skin);
    } else {
      const category = weaponCategories[skin.weapon_name] || 'other';
      if (categorized[category]) {
        categorized[category].push(skin);
      }
    }
  });

  return categorized;
}

// Clear cache function for manual refresh
export function clearCache(): void {
  skinsCache = [];
  agentsCache = [];
  stickersCache = [];
  keychainsCache = [];
  glovesCache = [];
  musicCache = [];
  lastCacheUpdate = 0;
}

// Get cache info
export function getCacheInfo() {
  return {
    lastUpdated: lastCacheUpdate,
    isValid: getCacheStatus().isValid,
    sizes: {
      skins: skinsCache.length,
      agents: agentsCache.length,
      stickers: stickersCache.length,
      keychains: keychainsCache.length,
      gloves: glovesCache.length,
      music: musicCache.length
    }
  };
}
