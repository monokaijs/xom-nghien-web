import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { vpsInstances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NodeSSH } from 'node-ssh';

async function validateSSHConnection(ip: string, port: number, username: string, privateKey: string): Promise<{ success: boolean; error?: string }> {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: ip,
      port,
      username,
      privateKey,
      readyTimeout: 10000,
    });
    await ssh.dispose();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'SSH connection failed' };
  }
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    const result = await db.select({
      id: vpsInstances.id,
      name: vpsInstances.name,
      ip: vpsInstances.ip,
      port: vpsInstances.port,
      username: vpsInstances.username,
      openPortRangeStart: vpsInstances.openPortRangeStart,
      openPortRangeEnd: vpsInstances.openPortRangeEnd,
      maxGameInstances: vpsInstances.maxGameInstances,
      created_at: vpsInstances.created_at,
      updated_at: vpsInstances.updated_at,
    }).from(vpsInstances).where(eq(vpsInstances.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: 'VPS not found' }, { status: 404 });
    }

    return NextResponse.json({ vps: result[0] });
  } catch (error) {
    console.error('Error fetching VPS:', error);
    return NextResponse.json({ error: 'Failed to fetch VPS' }, { status: 500 });
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
    const { name, ip, port, username, privateKey, openPortRangeStart, openPortRangeEnd, maxGameInstances } = body;

    if (!name || !ip || !port || !username || !openPortRangeStart || !openPortRangeEnd) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (openPortRangeStart >= openPortRangeEnd) {
      return NextResponse.json(
        { error: 'Port range start must be less than end' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(vpsInstances).where(eq(vpsInstances.id, parseInt(id)));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'VPS not found' }, { status: 404 });
    }

    const keyToValidate = privateKey || existing[0].privateKey;
    const sshValidation = await validateSSHConnection(ip, port, username, keyToValidate);
    if (!sshValidation.success) {
      return NextResponse.json(
        { error: `SSH validation failed: ${sshValidation.error}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      ip,
      port,
      username,
      openPortRangeStart,
      openPortRangeEnd,
      maxGameInstances: maxGameInstances || 5,
    };

    if (privateKey) {
      updateData.privateKey = privateKey;
    }

    await db.update(vpsInstances)
      .set(updateData)
      .where(eq(vpsInstances.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating VPS:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A VPS with this IP already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update VPS' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> }
) => {
  const { id } = await segmentData.params;

  try {
    await db.delete(vpsInstances).where(eq(vpsInstances.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting VPS:', error);
    return NextResponse.json({ error: 'Failed to delete VPS' }, { status: 500 });
  }
});

