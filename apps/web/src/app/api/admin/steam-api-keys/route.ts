import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Steam API key management has been replaced by game credentials' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'Steam API key management has been replaced by game credentials' }, { status: 410 });
}
