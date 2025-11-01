import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { executeQuery } from '@/lib/database';
import { CraftedSkin, CS2Skin, CS2Glove, CS2Sticker, CS2Keychain, InventoryItem } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';

let skinsCache: CS2Skin[] = [];
let glovesCache: CS2Glove[] = [];
let stickersCache: CS2Sticker[] = [];
let keychainsCache: CS2Keychain[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchExternalData() {
  const now = Date.now();
  if (now - lastCacheUpdate < CACHE_DURATION && skinsCache.length > 0) {
    return;
  }

  try {
    const [skinsRes, glovesRes, stickersRes, keychainsRes] = await Promise.all([
      fetch(`${GITHUB_RAW_BASE}/skins.json`),
      fetch(`${GITHUB_RAW_BASE}/gloves.json`),
      fetch(`${GITHUB_RAW_BASE}/stickers.json`),
      fetch(`${GITHUB_RAW_BASE}/keychains.json`)
    ]);

    if (skinsRes.ok) skinsCache = await skinsRes.json();
    if (glovesRes.ok) glovesCache = await glovesRes.json();
    if (stickersRes.ok) stickersCache = await stickersRes.json();
    if (keychainsRes.ok) keychainsCache = await keychainsRes.json();

    lastCacheUpdate = now;
  } catch (error) {
    console.error('Error fetching external data:', error);
  }
}

function parseStickers(craftedSkin: CraftedSkin): (CS2Sticker | null)[] {
  const stickerSlots = [
    craftedSkin.weapon_sticker_0,
    craftedSkin.weapon_sticker_1,
    craftedSkin.weapon_sticker_2,
    craftedSkin.weapon_sticker_3,
    craftedSkin.weapon_sticker_4
  ];

  return stickerSlots.map(slot => {
    if (!slot || slot === '0' || slot === '0;0;0;0;0;0;0') return null;
    const stickerId = slot.split(';')[0];
    return stickersCache.find(s => s.id === stickerId) || null;
  });
}

function parseKeychain(craftedSkin: CraftedSkin): CS2Keychain | null {
  if (!craftedSkin.weapon_keychain || craftedSkin.weapon_keychain === '0' || craftedSkin.weapon_keychain === '0;0;0;0;0') {
    return null;
  }
  const keychainId = craftedSkin.weapon_keychain.split(';')[0];
  return keychainsCache.find(k => k.id === keychainId) || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await fetchExternalData();

    const craftedSkins = await executeQuery(
      'SELECT * FROM wp_player_inventory WHERE steamid = ? ORDER BY created_at DESC',
      [session.user.steamid]
    ) as CraftedSkin[];

    const inventoryItems: InventoryItem[] = [];

    for (const craftedSkin of craftedSkins) {
      const isGlove = craftedSkin.weapon_defindex >= 5027 && craftedSkin.weapon_defindex <= 5035;
      
      let skinData: CS2Skin | undefined;
      let gloveData: CS2Glove | undefined;
      let weaponName = 'Unknown';

      if (isGlove) {
        gloveData = glovesCache.find(g => 
          g.weapon_defindex.toString() === craftedSkin.weapon_defindex.toString() &&
          g.paint.toString() === craftedSkin.weapon_paint_id.toString()
        );
        weaponName = gloveData?.paint_name || 'Unknown Glove';
      } else {
        skinData = skinsCache.find(s =>
          s.weapon_defindex === craftedSkin.weapon_defindex &&
          s.paint.toString() === craftedSkin.weapon_paint_id.toString()
        );
        weaponName = skinData?.paint_name || 'Unknown Weapon';
      }

      inventoryItems.push({
        craftedSkin,
        skinData,
        gloveData,
        stickers: parseStickers(craftedSkin),
        keychain: parseKeychain(craftedSkin),
        weaponName,
        category: getWeaponCategory(craftedSkin.weapon_defindex),
        isDefault: false
      });
    }

    const uniqueWeapons = getUniqueWeapons();
    const craftedWeaponKeys = new Set(
      craftedSkins.map(cs => `${cs.weapon_defindex}_${cs.weapon_paint_id}`)
    );

    for (const weapon of uniqueWeapons) {
      const defaultKey = `${weapon.weapon_defindex}_${weapon.paint}`;
      if (!craftedWeaponKeys.has(defaultKey)) {
        inventoryItems.push({
          skinData: weapon,
          stickers: [],
          keychain: null,
          weaponName: weapon.paint_name,
          category: getWeaponCategory(weapon.weapon_defindex),
          isDefault: true
        });
      }
    }

    return NextResponse.json({
      inventory: inventoryItems,
      total: inventoryItems.length
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      weapon_defindex,
      weapon_paint_id,
      weapon_wear = 0.0,
      weapon_seed = 0,
      weapon_nametag = '',
      weapon_stattrak = 0,
      weapon_sticker_0 = '0',
      weapon_sticker_1 = '0',
      weapon_sticker_2 = '0',
      weapon_sticker_3 = '0',
      weapon_sticker_4 = '0',
      weapon_keychain = '0'
    } = body;

    const existingSkin = await executeQuery(
      'SELECT * FROM wp_player_inventory WHERE steamid = ? AND weapon_defindex = ? AND weapon_paint_id = ?',
      [session.user.steamid, weapon_defindex, weapon_paint_id]
    ) as CraftedSkin[];

    if (existingSkin.length > 0) {
      await executeQuery(
        `UPDATE wp_player_inventory SET 
          weapon_wear = ?, weapon_seed = ?, weapon_nametag = ?, weapon_stattrak = ?,
          weapon_sticker_0 = ?, weapon_sticker_1 = ?, weapon_sticker_2 = ?, 
          weapon_sticker_3 = ?, weapon_sticker_4 = ?, weapon_keychain = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE steamid = ? AND weapon_defindex = ? AND weapon_paint_id = ?`,
        [
          weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak,
          weapon_sticker_0, weapon_sticker_1, weapon_sticker_2,
          weapon_sticker_3, weapon_sticker_4, weapon_keychain,
          session.user.steamid, weapon_defindex, weapon_paint_id
        ]
      );
    } else {
      await executeQuery(
        `INSERT INTO wp_player_inventory 
          (steamid, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, 
           weapon_nametag, weapon_stattrak, weapon_sticker_0, weapon_sticker_1, 
           weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.user.steamid, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed,
          weapon_nametag, weapon_stattrak, weapon_sticker_0, weapon_sticker_1,
          weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error crafting skin:', error);
    return NextResponse.json(
      { error: 'Failed to craft skin' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, team } = body;

    if (action === 'equip') {
      const craftedSkin = await executeQuery(
        'SELECT * FROM wp_player_inventory WHERE id = ? AND steamid = ?',
        [id, session.user.steamid]
      ) as CraftedSkin[];

      if (craftedSkin.length === 0) {
        return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
      }

      const skin = craftedSkin[0];
      
      await executeQuery(
        `UPDATE wp_player_inventory SET equipped_${team === 3 ? 'ct' : 't'} = 0 
         WHERE steamid = ? AND weapon_defindex = ?`,
        [session.user.steamid, skin.weapon_defindex]
      );

      await executeQuery(
        `UPDATE wp_player_inventory SET equipped_${team === 3 ? 'ct' : 't'} = 1 
         WHERE id = ? AND steamid = ?`,
        [id, session.user.steamid]
      );

      await executeQuery(
        `INSERT INTO wp_player_skins 
          (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, 
           weapon_nametag, weapon_stattrak, weapon_sticker_0, weapon_sticker_1, 
           weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           weapon_paint_id = VALUES(weapon_paint_id),
           weapon_wear = VALUES(weapon_wear),
           weapon_seed = VALUES(weapon_seed),
           weapon_nametag = VALUES(weapon_nametag),
           weapon_stattrak = VALUES(weapon_stattrak),
           weapon_sticker_0 = VALUES(weapon_sticker_0),
           weapon_sticker_1 = VALUES(weapon_sticker_1),
           weapon_sticker_2 = VALUES(weapon_sticker_2),
           weapon_sticker_3 = VALUES(weapon_sticker_3),
           weapon_sticker_4 = VALUES(weapon_sticker_4),
           weapon_keychain = VALUES(weapon_keychain)`,
        [
          session.user.steamid, team, skin.weapon_defindex, skin.weapon_paint_id,
          skin.weapon_wear, skin.weapon_seed, skin.weapon_nametag, skin.weapon_stattrak,
          skin.weapon_sticker_0, skin.weapon_sticker_1, skin.weapon_sticker_2,
          skin.weapon_sticker_3, skin.weapon_sticker_4, skin.weapon_keychain
        ]
      );
    } else if (action === 'unequip') {
      await executeQuery(
        `UPDATE wp_player_inventory SET equipped_${team === 3 ? 'ct' : 't'} = 0 
         WHERE id = ? AND steamid = ?`,
        [id, session.user.steamid]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing skin ID' }, { status: 400 });
    }

    await executeQuery(
      'DELETE FROM wp_player_inventory WHERE id = ? AND steamid = ?',
      [id, session.user.steamid]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skin:', error);
    return NextResponse.json(
      { error: 'Failed to delete skin' },
      { status: 500 }
    );
  }
}

function getWeaponCategory(weaponDefindex: number): string {
  const categoryMap: Record<number, string> = {
    1: 'pistols', 2: 'pistols', 3: 'pistols', 4: 'pistols', 30: 'pistols',
    32: 'pistols', 36: 'pistols', 61: 'pistols', 63: 'pistols', 64: 'pistols',
    7: 'rifles', 8: 'rifles', 10: 'rifles', 13: 'rifles', 16: 'rifles',
    39: 'rifles', 60: 'rifles',
    17: 'smg', 19: 'smg', 23: 'smg', 24: 'smg', 26: 'smg', 33: 'smg', 34: 'smg',
    25: 'shotguns', 27: 'shotguns', 29: 'shotguns', 35: 'shotguns',
    9: 'snipers', 11: 'snipers', 38: 'snipers', 40: 'snipers',
    14: 'machineguns', 28: 'machineguns'
  };

  if (weaponDefindex >= 500 && weaponDefindex <= 525) return 'knives';
  if (weaponDefindex >= 5027 && weaponDefindex <= 5035) return 'gloves';

  return categoryMap[weaponDefindex] || 'other';
}

function getUniqueWeapons(): CS2Skin[] {
  const uniqueWeapons: CS2Skin[] = [];
  const seenDefindex = new Set<number>();

  for (const skin of skinsCache) {
    if (skin.paint_name.includes('Default') && !seenDefindex.has(skin.weapon_defindex)) {
      uniqueWeapons.push(skin);
      seenDefindex.add(skin.weapon_defindex);
    }
  }

  return uniqueWeapons;
}

