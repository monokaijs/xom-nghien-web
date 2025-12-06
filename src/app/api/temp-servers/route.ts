import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { vpsInstances, tempGameServers, steamApiKeys } from '@/lib/db/schema';
import { eq, and, gt, isNotNull, notInArray } from 'drizzle-orm';
import { VpsManager } from '@/lib/vps-manager';
import { v4 as uuidv4 } from 'uuid';

async function findAvailableVpsAndPort(): Promise<{ vps: any; port: number } | null> {
  const allVps = await db.select().from(vpsInstances);

  for (const vps of allVps) {
    const activeServers = await db.select()
      .from(tempGameServers)
      .where(and(
        eq(tempGameServers.vpsId, vps.id),
        gt(tempGameServers.expires_at, new Date())
      ));

    if (activeServers.length >= vps.maxGameInstances) {
      continue;
    }

    const usedPorts = new Set(activeServers.map(s => s.assignedPort));

    for (let port = vps.openPortRangeStart; port <= vps.openPortRangeEnd; port++) {
      if (!usedPorts.has(port)) {
        return { vps, port };
      }
    }
  }

  return null;
}

async function findAvailableSteamApiKey(): Promise<{ id: number; apiKey: string; steamAccount: string | null } | null> {
  const activeServerKeyIds = await db.select({ steamApiKeyId: tempGameServers.steamApiKeyId })
    .from(tempGameServers)
    .where(and(
      gt(tempGameServers.expires_at, new Date()),
      isNotNull(tempGameServers.steamApiKeyId)
    ));

  const usedKeyIds = activeServerKeyIds
    .map(s => s.steamApiKeyId)
    .filter((id): id is number => id !== null);

  let query = db.select()
    .from(steamApiKeys)
    .where(eq(steamApiKeys.isActive, 1));

  if (usedKeyIds.length > 0) {
    query = db.select()
      .from(steamApiKeys)
      .where(and(
        eq(steamApiKeys.isActive, 1),
        notInArray(steamApiKeys.id, usedKeyIds)
      ));
  }

  const availableKeys = await query.limit(1);

  if (availableKeys.length === 0) {
    return null;
  }

  return {
    id: availableKeys[0].id,
    apiKey: availableKeys[0].apiKey,
    steamAccount: availableKeys[0].steamAccount,
  };
}

export const GET = requireAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const userServers = await db.select({
      id: tempGameServers.id,
      vpsId: tempGameServers.vpsId,
      assignedPort: tempGameServers.assignedPort,
      status: tempGameServers.status,
      rconPassword: tempGameServers.rconPassword,
      created_at: tempGameServers.created_at,
      expires_at: tempGameServers.expires_at,
      vpsIp: vpsInstances.ip,
      vpsName: vpsInstances.name,
    })
    .from(tempGameServers)
    .innerJoin(vpsInstances, eq(tempGameServers.vpsId, vpsInstances.id))
    .where(and(
      eq(tempGameServers.createdBy, user.steamId),
      gt(tempGameServers.expires_at, new Date())
    ));

    return NextResponse.json({ servers: userServers });
  } catch (error) {
    console.error('Error fetching temp servers:', error);
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
  }
});

export const POST = requireAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const existingServer = await db.select()
      .from(tempGameServers)
      .where(and(
        eq(tempGameServers.createdBy, user.steamId),
        gt(tempGameServers.expires_at, new Date())
      ))
      .limit(1);

    if (existingServer.length > 0) {
      return NextResponse.json(
        { error: 'You already have an active temporary server' },
        { status: 400 }
      );
    }

    const available = await findAvailableVpsAndPort();
    if (!available) {
      return NextResponse.json(
        { error: 'No available VPS slots. Please try again later.' },
        { status: 503 }
      );
    }

    const steamApiKey = await findAvailableSteamApiKey();
    if (!steamApiKey) {
      return NextResponse.json(
        { error: 'No available Steam API keys. Please try again later.' },
        { status: 503 }
      );
    }

    const { vps, port } = available;
    const tempServerId = `temp-${uuidv4().slice(0, 8)}`;
    const rconPassword = process.env.DEFAULT_RCON_PASSWORD || 'changeme';
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const vpsManager = new VpsManager(vps.ip, vps.port, vps.username, vps.privateKey);

    const spawnResult = await vpsManager.spawnNewServer({
      tempServerId,
      port,
      rconPassword,
      steamAccount: steamApiKey.steamAccount || process.env.STEAM_ACCOUNT || '',
    });

    if (spawnResult.stderr && !spawnResult.stdout) {
      console.error('Failed to spawn server:', spawnResult.stderr);
      return NextResponse.json(
        { error: 'Failed to spawn game server' },
        { status: 500 }
      );
    }

    const containerId = spawnResult.stdout.trim();

    const result = await db.insert(tempGameServers).values({
      vpsId: vps.id,
      steamApiKeyId: steamApiKey.id,
      assignedPort: port,
      status: 'online',
      rconPassword,
      containerId,
      createdBy: user.steamId,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      server: {
        id: result[0].insertId,
        ip: vps.ip,
        port,
        rconPassword,
        expiresAt: expiresAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating temp server:', error);
    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 });
  }
});

