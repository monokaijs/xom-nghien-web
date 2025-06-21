import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { executeQuery } from '@/lib/database';
import { UserSkinConfig, CS2Skin, CS2Agent, CS2Glove, CS2Music, CS2Sticker, CS2Keychain } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/main/src/data';

// Cache for external data
let skinsCache: CS2Skin[] = [];
let agentsCache: CS2Agent[] = [];
let glovesCache: CS2Glove[] = [];
let musicCache: CS2Music[] = [];
let stickersCache: CS2Sticker[] = [];
let keychainsCache: CS2Keychain[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchExternalData() {
  const now = Date.now();
  if (now - lastCacheUpdate < CACHE_DURATION && skinsCache.length > 0) {
    return;
  }

  try {
    const [skinsRes, agentsRes, glovesRes, musicRes, stickersRes, keychainsRes] = await Promise.all([
      fetch(`${GITHUB_RAW_BASE}/skins.json`),
      fetch(`${GITHUB_RAW_BASE}/agents.json`),
      fetch(`${GITHUB_RAW_BASE}/gloves.json`),
      fetch(`${GITHUB_RAW_BASE}/music.json`),
      fetch(`${GITHUB_RAW_BASE}/stickers.json`),
      fetch(`${GITHUB_RAW_BASE}/keychains.json`)
    ]);

    if (skinsRes.ok) skinsCache = await skinsRes.json();
    if (agentsRes.ok) agentsCache = await agentsRes.json();
    if (glovesRes.ok) glovesCache = await glovesRes.json();
    if (musicRes.ok) musicCache = await musicRes.json();
    if (stickersRes.ok) stickersCache = await stickersRes.json();
    if (keychainsRes.ok) keychainsCache = await keychainsRes.json();

    lastCacheUpdate = now;
  } catch (error) {
    console.error('Error fetching external data:', error);
  }
}

function categorizeWeapons() {
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

  return weaponCategories;
}

interface LoadoutItem {
  userConfig: UserSkinConfig;
  skinData?: CS2Skin;
  agentData?: CS2Agent;
  gloveData?: CS2Glove;
  musicData?: CS2Music;
  stickers: (CS2Sticker | null)[];
  keychain: CS2Keychain | null;
  category: string;
  weaponName: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch external data
    await fetchExternalData();

    // Fetch user's skin configurations
    const userSkins = await executeQuery(
      'SELECT * FROM wp_player_skins WHERE steamid = ? ORDER BY weapon_team, weapon_defindex',
      [session.user.steamid]
    ) as UserSkinConfig[];

    const weaponCategories = categorizeWeapons();
    const loadoutItems: LoadoutItem[] = [];

    // Process each user skin configuration
    for (const userSkin of userSkins) {
      let loadoutItem: LoadoutItem = {
        userConfig: userSkin,
        stickers: [],
        keychain: null,
        category: 'other',
        weaponName: 'Unknown'
      };

      // Handle different item types
      if (userSkin.weapon_defindex === 0) {
        // Agent
        const agentData = agentsCache.find(a => a.model === userSkin.weapon_paint_id.toString());
        if (agentData) {
          loadoutItem.agentData = agentData;
          loadoutItem.category = 'agents';
          loadoutItem.weaponName = agentData.agent_name;
        }
      } else if (userSkin.weapon_defindex === -1) {
        // Music kit
        const musicData = musicCache.find(m => m.id === parseInt(userSkin.weapon_paint_id.toString()));
        if (musicData) {
          loadoutItem.musicData = musicData;
          loadoutItem.category = 'music';
          loadoutItem.weaponName = musicData.name;
        }
      } else {
        // Weapon or glove
        const skinData = skinsCache.find(s => 
          s.weapon_defindex === userSkin.weapon_defindex && 
          s.paint === userSkin.weapon_paint_id.toString()
        );
        
        if (skinData) {
          loadoutItem.skinData = skinData;
          loadoutItem.weaponName = skinData.paint_name;
          
          // Categorize weapon
          if (skinData.weapon_name.includes('knife')) {
            loadoutItem.category = 'knives';
          } else {
            loadoutItem.category = weaponCategories[skinData.weapon_name] || 'other';
          }
        }

        // Handle gloves separately if needed
        const gloveData = glovesCache.find(g => 
          g.weapon_defindex === userSkin.weapon_defindex && 
          g.paint === userSkin.weapon_paint_id.toString()
        );
        
        if (gloveData) {
          loadoutItem.gloveData = gloveData;
          loadoutItem.category = 'gloves';
          loadoutItem.weaponName = gloveData.paint_name;
        }
      }

      // Process stickers
      const stickerIds = [
        userSkin.weapon_sticker_0,
        userSkin.weapon_sticker_1,
        userSkin.weapon_sticker_2,
        userSkin.weapon_sticker_3,
        userSkin.weapon_sticker_4
      ];

      loadoutItem.stickers = stickerIds.map(stickerId => {
        if (!stickerId || stickerId === '0') return null;
        const stickerIdOnly = stickerId.split(';')[0];
        return stickersCache.find(s => s.id === stickerIdOnly) || null;
      });

      // Process keychain
      if (userSkin.weapon_keychain && userSkin.weapon_keychain !== '0') {
        const keychainIdOnly = userSkin.weapon_keychain.split(';')[0];
        loadoutItem.keychain = keychainsCache.find(k => k.id === keychainIdOnly) || null;
      }

      loadoutItems.push(loadoutItem);
    }

    // Group by category
    const categorizedLoadout = {
      pistols: loadoutItems.filter(item => item.category === 'pistols'),
      rifles: loadoutItems.filter(item => item.category === 'rifles'),
      smg: loadoutItems.filter(item => item.category === 'smg'),
      machineguns: loadoutItems.filter(item => item.category === 'machineguns'),
      snipers: loadoutItems.filter(item => item.category === 'snipers'),
      shotguns: loadoutItems.filter(item => item.category === 'shotguns'),
      knives: loadoutItems.filter(item => item.category === 'knives'),
      gloves: loadoutItems.filter(item => item.category === 'gloves'),
      agents: loadoutItems.filter(item => item.category === 'agents'),
      music: loadoutItems.filter(item => item.category === 'music'),
    };

    return NextResponse.json({
      loadout: categorizedLoadout,
      total: loadoutItems.length,
    });
  } catch (error) {
    console.error('Error fetching user loadout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user loadout' },
      { status: 500 }
    );
  }
}
