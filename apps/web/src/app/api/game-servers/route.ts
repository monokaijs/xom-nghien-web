import { NextResponse } from 'next/server';
import { getServersWithStatus } from '@/lib/utils/servers';

export async function GET() {
  return NextResponse.json({
    servers: await getServersWithStatus(),
  });
}
