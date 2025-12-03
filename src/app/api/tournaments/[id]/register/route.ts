import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers, userInfo } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (request: NextRequest, user, context: any) => {
  try {
    const { params } = context;
    const { id } = await params;
    const tournamentId = parseInt(id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { team_number } = body;

    if (!team_number || ![1, 2].includes(team_number)) {
      return NextResponse.json(
        { error: 'Valid team_number (1 or 2) is required' },
        { status: 400 }
      );
    }

    const tournamentResult = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (tournamentResult.length === 0) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const tournament = tournamentResult[0];

    if (tournament.registration_deadline) {
      const deadline = new Date(tournament.registration_deadline);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Registration deadline has passed' },
          { status: 400 }
        );
      }
    }

    const existingRegistration = await db
      .select()
      .from(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournament_id, tournamentId),
          eq(tournamentPlayers.steamid64, user.steamId)
        )
      )
      .limit(1);

    if (existingRegistration.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered for this tournament' },
        { status: 400 }
      );
    }

    const teamPlayers = await db
      .select()
      .from(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournament_id, tournamentId),
          eq(tournamentPlayers.team_number, team_number)
        )
      );

    if (teamPlayers.length >= tournament.players_per_team) {
      return NextResponse.json(
        { error: 'Team is full' },
        { status: 400 }
      );
    }

    const userInfoResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, user.steamId))
      .limit(1);

    const playerName = userInfoResult.length > 0 ? userInfoResult[0].name : 'Player';

    await db.insert(tournamentPlayers).values({
      tournament_id: tournamentId,
      team_number,
      steamid64: user.steamId,
      player_name: playerName,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for tournament',
    });
  } catch (error: any) {
    console.error('Error registering for tournament:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'You are already registered for this tournament' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register for tournament' },
      { status: 500 }
    );
  }
});

export const DELETE = requireAuth(async (request: NextRequest, user, context: any) => {
  try {
    const { params } = context;
    const { id } = await params;
    const tournamentId = parseInt(id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const tournamentResult = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (tournamentResult.length === 0) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const tournament = tournamentResult[0];

    if (tournament.registration_deadline) {
      const deadline = new Date(tournament.registration_deadline);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Cannot unregister after registration deadline' },
          { status: 400 }
        );
      }
    }

    const result = await db
      .delete(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournament_id, tournamentId),
          eq(tournamentPlayers.steamid64, user.steamId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Successfully unregistered from tournament',
    });
  } catch (error) {
    console.error('Error unregistering from tournament:', error);
    return NextResponse.json(
      { error: 'Failed to unregister from tournament' },
      { status: 500 }
    );
  }
});

