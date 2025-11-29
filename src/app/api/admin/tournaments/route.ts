import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = sql`
      SELECT * FROM ${tournaments}
      WHERE 1=1
    `;

    if (search) {
      query = sql`
        SELECT * FROM ${tournaments}
        WHERE team1_name LIKE ${`%${search}%`}
        OR team2_name LIKE ${`%${search}%`}
      `;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const result = await db.execute(query);
    const tournamentList = result[0] as unknown as any[];

    return NextResponse.json({
      tournaments: tournamentList,
      total: tournamentList.length,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      team1_name,
      team2_name,
      num_maps,
      maplist,
      clinch_series,
      players_per_team,
      cvars,
      team1_players,
      team2_players,
    } = body;

    if (!team1_name || !team2_name || !num_maps || !maplist || !Array.isArray(maplist)) {
      return NextResponse.json(
        { error: 'Team names, num_maps, and maplist are required' },
        { status: 400 }
      );
    }

    if (![1, 3, 5].includes(num_maps)) {
      return NextResponse.json(
        { error: 'num_maps must be 1, 3, or 5' },
        { status: 400 }
      );
    }

    if (maplist.length !== num_maps) {
      return NextResponse.json(
        { error: 'maplist length must match num_maps' },
        { status: 400 }
      );
    }

    const result = await db.insert(tournaments).values({
      team1_name,
      team2_name,
      num_maps,
      maplist,
      clinch_series: clinch_series ? 1 : 0,
      players_per_team: players_per_team || 5,
      cvars: cvars || {},
    });

    const tournamentId = result[0].insertId;

    if (team1_players && Array.isArray(team1_players)) {
      for (const player of team1_players) {
        await db.insert(tournamentPlayers).values({
          tournament_id: tournamentId,
          team_number: 1,
          steamid64: player.steamid64,
          player_name: player.name,
        });
      }
    }

    if (team2_players && Array.isArray(team2_players)) {
      for (const player of team2_players) {
        await db.insert(tournamentPlayers).values({
          tournament_id: tournamentId,
          team_number: 2,
          steamid64: player.steamid64,
          player_name: player.name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      tournamentId,
    });
  } catch (error: any) {
    console.error('Error creating tournament:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A player cannot be in both teams' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
});

