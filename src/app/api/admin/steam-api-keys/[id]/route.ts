import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { steamApiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select().from(steamApiKeys).where(eq(steamApiKeys.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Steam API key not found' }, { status: 404 });
    }

    return NextResponse.json({ steamApiKey: result[0] });
  } catch (error) {
    console.error('Error fetching Steam API key:', error);
    return NextResponse.json({ error: 'Failed to fetch Steam API key' }, { status: 500 });
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
    const { name, steamAccount, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      steamAccount: steamAccount || null,
      isActive: isActive !== false ? 1 : 0,
    };

    await db.update(steamApiKeys)
      .set(updateData)
      .where(eq(steamApiKeys.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating Steam API key:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'This GSLT already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update Steam API key' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    await db.delete(steamApiKeys).where(eq(steamApiKeys.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Steam API key:', error);
    return NextResponse.json({ error: 'Failed to delete Steam API key' }, { status: 500 });
  }
});

