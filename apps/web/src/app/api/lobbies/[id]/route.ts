import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json({ error: 'Lobby API has been replaced by game server instance actions' }, { status: 410 });
}
