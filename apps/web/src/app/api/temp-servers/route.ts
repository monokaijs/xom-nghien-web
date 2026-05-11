import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Temporary server API has been replaced by /api/game-servers' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'Temporary server creation has been replaced by admin game server deployments' }, { status: 410 });
}
