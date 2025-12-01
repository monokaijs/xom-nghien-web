import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { tournaments, tournamentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const playersResult = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournament_id, tournamentId));

    const team1Players: Record<string, string> = {};
    const team2Players: Record<string, string> = {};

    playersResult.forEach((player) => {
      if (player.team_number === 1) {
        team1Players[player.steamid64] = player.player_name;
      } else if (player.team_number === 2) {
        team2Players[player.steamid64] = player.player_name;
      }
    });

    const matchzyData = {
      team1: {
        name: tournament.team1_name,
        players: Object.keys(team1Players).length > 0 ? team1Players : undefined,
      },
      team2: {
        name: tournament.team2_name,
        players: Object.keys(team2Players).length > 0 ? team2Players : undefined,
      },
      num_maps: tournament.num_maps,
      maplist: tournament.maplist,
      clinch_series: tournament.clinch_series === 1,
      players_per_team: tournament.players_per_team,
      cvars: tournament.cvars || {},
    };

    return NextResponse.json(matchzyData);
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament data' },
      { status: 500 }
    );
  }
}

