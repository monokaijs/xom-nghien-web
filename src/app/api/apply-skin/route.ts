import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { executeQuery, executeTransaction } from '@/lib/database';

interface ApplySkinRequest {
  type: 'weapons' | 'gloves' | 'agents' | 'mvp' | 'knifes';
  weapon_team: number;
  weapon_defindex: number | string;
  weapon_paint_id: string | number;
  weapon_wear?: number;
  weapon_seed?: number;
  weapon_nametag?: string;
  weapon_stattrak?: number;
  weapon_sticker_0?: string;
  weapon_sticker_1?: string;
  weapon_sticker_2?: string;
  weapon_sticker_3?: string;
  weapon_sticker_4?: string;
  weapon_keychain?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const steamid = session.user.steamid;
    const body: ApplySkinRequest = await request.json();

    const {
      type,
      weapon_team,
      weapon_defindex,
      weapon_paint_id,
      weapon_wear = 0.1,
      weapon_seed = 0,
      weapon_nametag = '',
      weapon_stattrak = 0,
      weapon_sticker_0 = '0',
      weapon_sticker_1 = '0',
      weapon_sticker_2 = '0',
      weapon_sticker_3 = '0',
      weapon_sticker_4 = '0',
      weapon_keychain = '0',
    } = body;

    // Validate required fields
    if (!type || weapon_team === undefined || weapon_defindex === undefined || weapon_paint_id === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle different types of updates similar to the PHP update.php
    switch (type) {
      case 'gloves':
        await handleGlovesUpdate(steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak);
        break;
        
      case 'agents':
        await handleAgentsUpdate(steamid, weapon_team, weapon_defindex);
        break;
        
      case 'mvp':
        await handleMusicUpdate(steamid, weapon_team, weapon_defindex);
        break;
        
      case 'weapons':
      case 'knifes':
      default:
        await handleWeaponsUpdate(
          steamid,
          weapon_team,
          weapon_defindex as number,
          weapon_paint_id,
          weapon_wear,
          weapon_seed,
          weapon_nametag,
          weapon_stattrak,
          weapon_sticker_0,
          weapon_sticker_1,
          weapon_sticker_2,
          weapon_sticker_3,
          weapon_sticker_4,
          weapon_keychain
        );
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Skin configuration applied successfully',
    });

  } catch (error) {
    console.error('Error applying skin configuration:', error);
    return NextResponse.json(
      { error: 'Failed to apply skin configuration' },
      { status: 500 }
    );
  }
}

async function handleGlovesUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number | string,
  weapon_paint_id: string | number,
  weapon_wear: number,
  weapon_seed: number,
  weapon_nametag: string,
  weapon_stattrak: number
) {
  // Handle glove removal for specific teams
  if (weapon_paint_id === 'ct' || weapon_paint_id === 't') {
    const teamToRemove = weapon_paint_id === 'ct' ? 3 : 2;
    await executeQuery(
      'DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex >= 5027 AND weapon_defindex <= 5035',
      [steamid, teamToRemove]
    );
    return;
  }

  // Check if glove already exists for this team
  const existingGlove = await executeQuery(
    'SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex >= 5027 AND weapon_defindex <= 5035',
    [steamid, weapon_team]
  ) as any[];

  if (existingGlove.length > 0) {
    // Update existing glove
    await executeQuery(
      `UPDATE wp_player_skins SET 
        weapon_defindex = ?, weapon_paint_id = ?, weapon_wear = ?, weapon_seed = ?, 
        weapon_nametag = ?, weapon_stattrak = ?
       WHERE steamid = ? AND weapon_team = ? AND weapon_defindex >= 5027 AND weapon_defindex <= 5035`,
      [weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak, steamid, weapon_team]
    );
  } else {
    // Insert new glove
    await executeQuery(
      `INSERT INTO wp_player_skins 
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak]
    );
  }
}

async function handleAgentsUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number | string
) {
  if (weapon_defindex === 'default') {
    // Remove agent
    await executeQuery(
      'DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = 0',
      [steamid, weapon_team]
    );
    return;
  }

  // Check if agent already exists for this team
  const existingAgent = await executeQuery(
    'SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = 0',
    [steamid, weapon_team]
  ) as any[];

  if (existingAgent.length > 0) {
    // Update existing agent
    await executeQuery(
      'UPDATE wp_player_skins SET weapon_paint_id = ? WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = 0',
      [weapon_defindex, steamid, weapon_team]
    );
  } else {
    // Insert new agent
    await executeQuery(
      `INSERT INTO wp_player_skins 
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak) 
       VALUES (?, ?, 0, ?, 0, 0, '', 0)`,
      [steamid, weapon_team, weapon_defindex]
    );
  }
}

async function handleMusicUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number | string
) {
  // Check if music kit already exists
  const existingMusic = await executeQuery(
    'SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = -1',
    [steamid, weapon_team]
  ) as any[];

  if (existingMusic.length > 0) {
    // Update existing music kit
    await executeQuery(
      'UPDATE wp_player_skins SET weapon_paint_id = ? WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = -1',
      [weapon_defindex, steamid, weapon_team]
    );
  } else {
    // Insert new music kit
    await executeQuery(
      `INSERT INTO wp_player_skins 
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak) 
       VALUES (?, ?, -1, ?, 0, 0, '', 0)`,
      [steamid, weapon_team, weapon_defindex]
    );
  }
}

async function handleWeaponsUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number,
  weapon_paint_id: string | number,
  weapon_wear: number,
  weapon_seed: number,
  weapon_nametag: string,
  weapon_stattrak: number,
  weapon_sticker_0: string,
  weapon_sticker_1: string,
  weapon_sticker_2: string,
  weapon_sticker_3: string,
  weapon_sticker_4: string,
  weapon_keychain: string
) {
  // Check if weapon already exists
  const existingWeapon = await executeQuery(
    'SELECT * FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = ?',
    [steamid, weapon_team, weapon_defindex]
  ) as any[];

  if (existingWeapon.length > 0) {
    // Update existing weapon
    await executeQuery(
      `UPDATE wp_player_skins SET 
        weapon_paint_id = ?, weapon_wear = ?, weapon_seed = ?, weapon_nametag = ?, weapon_stattrak = ?,
        weapon_sticker_0 = ?, weapon_sticker_1 = ?, weapon_sticker_2 = ?, weapon_sticker_3 = ?, weapon_sticker_4 = ?,
        weapon_keychain = ?
       WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = ?`,
      [
        weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak,
        weapon_sticker_0, weapon_sticker_1, weapon_sticker_2, weapon_sticker_3, weapon_sticker_4,
        weapon_keychain, steamid, weapon_team, weapon_defindex
      ]
    );
  } else {
    // Insert new weapon
    await executeQuery(
      `INSERT INTO wp_player_skins 
        (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak,
         weapon_sticker_0, weapon_sticker_1, weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_nametag, weapon_stattrak,
        weapon_sticker_0, weapon_sticker_1, weapon_sticker_2, weapon_sticker_3, weapon_sticker_4, weapon_keychain
      ]
    );
  }
}
