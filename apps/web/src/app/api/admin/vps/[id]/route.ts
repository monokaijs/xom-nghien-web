import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'VPS management has been replaced by server hosts' }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: 'VPS management has been replaced by server hosts' }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'VPS management has been replaced by server hosts' }, { status: 410 });
}
