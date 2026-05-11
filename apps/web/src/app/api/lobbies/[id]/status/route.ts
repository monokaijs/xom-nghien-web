import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Lobby status API has been replaced by /api/game-servers' }, { status: 410 });
}
