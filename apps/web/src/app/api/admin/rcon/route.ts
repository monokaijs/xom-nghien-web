import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'RCON now targets /api/admin/game-server-instances/[id]/rcon' }, { status: 410 });
}
