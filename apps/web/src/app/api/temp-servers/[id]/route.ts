import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Temporary server API has been replaced by /api/game-servers' }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Temporary server API has been replaced by game server instance actions' }, { status: 410 });
}
