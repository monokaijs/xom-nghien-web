import { NextRequest, NextResponse } from 'next/server';
import { CS2Skin } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';

// Cache for skin data
let skinsCache: CS2Skin[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchSkinsData(): Promise<CS2Skin[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/skins.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch skins: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching skins data:', error);
    return [];
  }
}

function categorizeWeapons(skins: CS2Skin[]) {
  const categories = {
    pistols: [] as CS2Skin[],
    rifles: [] as CS2Skin[],
    smg: [] as CS2Skin[],
    shotguns: [] as CS2Skin[],
    snipers: [] as CS2Skin[],
    machineguns: [] as CS2Skin[],
    knives: [] as CS2Skin[],
  };

  // Weapon categorization based on weapon_name
  const weaponCategories: Record<string, keyof typeof categories> = {
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

  skins.forEach(skin => {
    if (skin.weapon_name.includes('knife')) {
      categories.knives.push(skin);
    } else {
      const category = weaponCategories[skin.weapon_name];
      if (category) {
        categories[category].push(skin);
      }
    }
  });

  return categories;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || skinsCache.length === 0) {
      console.log('Refreshing skins cache...');
      skinsCache = await fetchSkinsData();
      lastCacheUpdate = now;
    }

    let responseData;

    if (category) {
      const categorized = categorizeWeapons(skinsCache);
      responseData = {
        category,
        skins: categorized[category as keyof typeof categorized] || [],
        total: (categorized[category as keyof typeof categorized] || []).length,
      };
    } else {
      const categorized = categorizeWeapons(skinsCache);
      responseData = {
        categories: categorized,
        total: skinsCache.length,
        lastUpdated: new Date(lastCacheUpdate).toISOString(),
      };
    }

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('Error in skins API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skins data' },
      { status: 500 }
    );
  }
}
