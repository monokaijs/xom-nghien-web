import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/database';
import { playerSkins } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

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
  if (weapon_paint_id === 'ct' || weapon_paint_id === 't') {
    const teamToRemove = weapon_paint_id === 'ct' ? 3 : 2;
    await db
      .delete(playerSkins)
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, teamToRemove),
          gte(playerSkins.weapon_defindex, 5027),
          lte(playerSkins.weapon_defindex, 5035)
        )
      );
    return;
  }

  const existingGlove = await db
    .select()
    .from(playerSkins)
    .where(
      and(
        eq(playerSkins.steamid, steamid),
        eq(playerSkins.weapon_team, weapon_team),
        gte(playerSkins.weapon_defindex, 5027),
        lte(playerSkins.weapon_defindex, 5035)
      )
    );

  if (existingGlove.length > 0) {
    await db
      .update(playerSkins)
      .set({
        weapon_defindex: Number(weapon_defindex),
        weapon_paint_id: String(weapon_paint_id),
        weapon_wear,
        weapon_seed,
        weapon_nametag,
        weapon_stattrak,
      })
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, weapon_team),
          gte(playerSkins.weapon_defindex, 5027),
          lte(playerSkins.weapon_defindex, 5035)
        )
      );
  } else {
    await db.insert(playerSkins).values({
      steamid,
      weapon_team,
      weapon_defindex: Number(weapon_defindex),
      weapon_paint_id: String(weapon_paint_id),
      weapon_wear,
      weapon_seed,
      weapon_nametag,
      weapon_stattrak,
    });
  }
}

async function handleAgentsUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number | string
) {
  if (weapon_defindex === 'default') {
    await db
      .delete(playerSkins)
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, weapon_team),
          eq(playerSkins.weapon_defindex, 0)
        )
      );
    return;
  }

  const existingAgent = await db
    .select()
    .from(playerSkins)
    .where(
      and(
        eq(playerSkins.steamid, steamid),
        eq(playerSkins.weapon_team, weapon_team),
        eq(playerSkins.weapon_defindex, 0)
      )
    );

  if (existingAgent.length > 0) {
    await db
      .update(playerSkins)
      .set({ weapon_paint_id: String(weapon_defindex) })
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, weapon_team),
          eq(playerSkins.weapon_defindex, 0)
        )
      );
  } else {
    await db.insert(playerSkins).values({
      steamid,
      weapon_team,
      weapon_defindex: 0,
      weapon_paint_id: String(weapon_defindex),
      weapon_wear: 0,
      weapon_seed: 0,
      weapon_nametag: '',
      weapon_stattrak: 0,
    });
  }
}

async function handleMusicUpdate(
  steamid: string,
  weapon_team: number,
  weapon_defindex: number | string
) {
  const existingMusic = await db
    .select()
    .from(playerSkins)
    .where(
      and(
        eq(playerSkins.steamid, steamid),
        eq(playerSkins.weapon_team, weapon_team),
        eq(playerSkins.weapon_defindex, -1)
      )
    );

  if (existingMusic.length > 0) {
    await db
      .update(playerSkins)
      .set({ weapon_paint_id: String(weapon_defindex) })
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, weapon_team),
          eq(playerSkins.weapon_defindex, -1)
        )
      );
  } else {
    await db.insert(playerSkins).values({
      steamid,
      weapon_team,
      weapon_defindex: -1,
      weapon_paint_id: String(weapon_defindex),
      weapon_wear: 0,
      weapon_seed: 0,
      weapon_nametag: '',
      weapon_stattrak: 0,
    });
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
  const existingWeapon = await db
    .select()
    .from(playerSkins)
    .where(
      and(
        eq(playerSkins.steamid, steamid),
        eq(playerSkins.weapon_team, weapon_team),
        eq(playerSkins.weapon_defindex, weapon_defindex)
      )
    );

  if (existingWeapon.length > 0) {
    await db
      .update(playerSkins)
      .set({
        weapon_paint_id: String(weapon_paint_id),
        weapon_wear,
        weapon_seed,
        weapon_nametag,
        weapon_stattrak,
        weapon_sticker_0,
        weapon_sticker_1,
        weapon_sticker_2,
        weapon_sticker_3,
        weapon_sticker_4,
        weapon_keychain,
      })
      .where(
        and(
          eq(playerSkins.steamid, steamid),
          eq(playerSkins.weapon_team, weapon_team),
          eq(playerSkins.weapon_defindex, weapon_defindex)
        )
      );
  } else {
    await db.insert(playerSkins).values({
      steamid,
      weapon_team,
      weapon_defindex,
      weapon_paint_id: String(weapon_paint_id),
      weapon_wear,
      weapon_seed,
      weapon_nametag,
      weapon_stattrak,
      weapon_sticker_0,
      weapon_sticker_1,
      weapon_sticker_2,
      weapon_sticker_3,
      weapon_sticker_4,
      weapon_keychain,
    });
  }
}
