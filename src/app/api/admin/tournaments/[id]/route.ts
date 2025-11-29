import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select().from(tournaments).where(eq(tournaments.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const players = await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.tournament_id, parseInt(id)));

    return NextResponse.json({
      tournament: result[0],
      players,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

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

    if (!team1_name || !team2_name || !num_maps || !maplist) {
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

    await db.update(tournaments).set({
      team1_name,
      team2_name,
      num_maps,
      maplist,
      clinch_series: clinch_series ? 1 : 0,
      players_per_team: players_per_team || 5,
      cvars: cvars || {},
    }).where(eq(tournaments.id, parseInt(id)));

    await db.delete(tournamentPlayers).where(eq(tournamentPlayers.tournament_id, parseInt(id)));

    if (team1_players && Array.isArray(team1_players)) {
      for (const player of team1_players) {
        await db.insert(tournamentPlayers).values({
          tournament_id: parseInt(id),
          team_number: 1,
          steamid64: player.steamid64,
          player_name: player.name,
        });
      }
    }

    if (team2_players && Array.isArray(team2_players)) {
      for (const player of team2_players) {
        await db.insert(tournamentPlayers).values({
          tournament_id: parseInt(id),
          team_number: 2,
          steamid64: player.steamid64,
          player_name: player.name,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tournament:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A player cannot be in both teams' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    await db.delete(tournamentPlayers).where(eq(tournamentPlayers.tournament_id, parseInt(id)));
    await db.delete(tournaments).where(eq(tournaments.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
});

