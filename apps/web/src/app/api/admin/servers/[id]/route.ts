import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Static server management has been replaced by game server instances' }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Static server management has been replaced by game server instances' }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Static server management has been replaced by game server instances' }, { status: 410 });
}
