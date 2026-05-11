import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Temporary server status API has been replaced by /api/game-servers' }, { status: 410 });
}
