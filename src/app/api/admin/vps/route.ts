import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { vpsInstances } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
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

export const GET = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    let query = sql`SELECT id, name, ip, port, username, open_port_range_start, open_port_range_end, max_game_instances, created_at, updated_at FROM vps_instances`;
    const conditions = [];

    if (search) {
      conditions.push(sql`(name LIKE ${`%${search}%`} OR ip LIKE ${`%${search}%`})`);
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const result = await db.execute(query);
    const vpsList = (result[0] as unknown) as any[];

    return NextResponse.json({ vpsInstances: vpsList });
  } catch (error) {
    console.error('Error fetching VPS instances:', error);
    return NextResponse.json({ error: 'Failed to fetch VPS instances' }, { status: 500 });
  }
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, ip, port, username, privateKey, openPortRangeStart, openPortRangeEnd, maxGameInstances } = body;

    if (!name || !ip || !port || !username || !privateKey || !openPortRangeStart || !openPortRangeEnd) {
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

    const sshValidation = await validateSSHConnection(ip, port, username, privateKey);
    if (!sshValidation.success) {
      return NextResponse.json(
        { error: `SSH validation failed: ${sshValidation.error}` },
        { status: 400 }
      );
    }

    const result = await db.insert(vpsInstances).values({
      name,
      ip,
      port,
      username,
      privateKey,
      openPortRangeStart,
      openPortRangeEnd,
      maxGameInstances: maxGameInstances || 5,
    });

    return NextResponse.json({
      success: true,
      vpsId: result[0].insertId
    });
  } catch (error: any) {
    console.error('Error creating VPS instance:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A VPS with this IP already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create VPS instance' }, { status: 500 });
  }
});

