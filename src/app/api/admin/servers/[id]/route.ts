import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { servers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select().from(servers).where(eq(servers.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server: result[0] });
  } catch (error) {
    console.error('Error fetching server:', error);
    return NextResponse.json({ error: 'Failed to fetch server' }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const body = await request.json();
    const { name, game, address, description, rcon_password } = body;

    if (!name || !game || !address) {
      return NextResponse.json(
        { error: 'Name, game, and address are required' },
        { status: 400 }
      );
    }

    await db.update(servers)
      .set({
        name,
        game,
        address,
        description: description || null,
        rcon_password: rcon_password || null,
      })
      .where(eq(servers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating server:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A server with this address already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update server' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    await db.delete(servers).where(eq(servers.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 });
  }
});

