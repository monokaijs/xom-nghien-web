import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser, getAuthUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { vpsInstances, tempGameServers, steamApiKeys, lobbies } from '@/lib/db/schema';
import { eq, and, gt, isNotNull, notInArray } from 'drizzle-orm';
import { VpsManager } from '@/lib/vps-manager';
import { v4 as uuidv4 } from 'uuid';
import { GameMode, CS2Map, isValidGameMode, isValidCS2Map } from '@/types/lobby';

async function findAvailableVpsAndPort(): Promise<{ vps: any; port: number } | null> {
  const allVps = await db.select().from(vpsInstances);
  for (const vps of allVps) {
    const activeServers = await db.select()
      .from(tempGameServers)
      .where(and(eq(tempGameServers.vpsId, vps.id), gt(tempGameServers.expires_at, new Date())));
    if (activeServers.length >= vps.maxGameInstances) continue;
    const usedPorts = new Set(activeServers.map(s => s.assignedPort));
    for (let port = vps.openPortRangeStart; port <= vps.openPortRangeEnd; port++) {
      if (!usedPorts.has(port)) return { vps, port };
    }
  }
  return null;
}

async function findAvailableSteamApiKey(): Promise<{ id: number; apiKey: string; steamAccount: string | null } | null> {
  const activeServerKeyIds = await db.select({ steamApiKeyId: tempGameServers.steamApiKeyId })
    .from(tempGameServers)
    .where(and(gt(tempGameServers.expires_at, new Date()), isNotNull(tempGameServers.steamApiKeyId)));
  const usedKeyIds = activeServerKeyIds.map(s => s.steamApiKeyId).filter((id): id is number => id !== null);
  let query = db.select().from(steamApiKeys).where(eq(steamApiKeys.isActive, 1));
  if (usedKeyIds.length > 0) {
    query = db.select().from(steamApiKeys).where(and(eq(steamApiKeys.isActive, 1), notInArray(steamApiKeys.id, usedKeyIds)));
  }
  const availableKeys = await query.limit(1);
  if (availableKeys.length === 0) return null;
  if (!process.env.STEAM_API_KEY) throw new Error('STEAM_API_KEY not configured');
  return { id: availableKeys[0].id, apiKey: process.env.STEAM_API_KEY, steamAccount: availableKeys[0].steamAccount };
}

export async function GET(request: NextRequest) {
  try {
    const activeLobbies = await db.select({
      id: lobbies.id,
      name: lobbies.name,
      gameMode: lobbies.gameMode,
      maxPlayers: lobbies.maxPlayers,
      map: lobbies.map,
      hasPassword: lobbies.serverPassword,
      tempGameServerId: lobbies.tempGameServerId,
      createdBy: lobbies.createdBy,
      created_at: lobbies.created_at,
      expires_at: lobbies.expires_at,
      serverIp: vpsInstances.ip,
      serverPort: tempGameServers.assignedPort,
      serverCreatedAt: tempGameServers.created_at,
    })
    .from(lobbies)
    .leftJoin(tempGameServers, eq(lobbies.tempGameServerId, tempGameServers.id))
    .leftJoin(vpsInstances, eq(tempGameServers.vpsId, vpsInstances.id))
    .where(gt(lobbies.expires_at, new Date()));

    if (activeLobbies.length === 0) {
      return NextResponse.json({ lobbies: [] });
    }

    const addressParams = activeLobbies
      .filter(lobby => lobby.serverIp && lobby.serverPort)
      .map(lobby => `counterstrike2:${lobby.serverIp}:${lobby.serverPort}`)
      .join(',');

    let statusData: any = { servers: [] };
    if (addressParams) {
      try {
        const statusUrl = `https://servers.xomnghien.com/?addresses=${addressParams}`;
        const statusResponse = await fetch(statusUrl, { next: { revalidate: 30 } });
        statusData = await statusResponse.json();
      } catch (error) {
        console.error('Failed to fetch server status:', error);
      }
    }

    let statusIndex = 0;
    const lobbiesWithStatus = activeLobbies.map((lobby) => {
      let status = 'initializing';
      let playerCount = 0;
      let currentMaxPlayers = lobby.maxPlayers;
      let currentMap = lobby.map;

      if (lobby.serverIp && lobby.serverPort) {
        const serverCreatedAt = lobby.serverCreatedAt ? new Date(lobby.serverCreatedAt).getTime() : 0;
        const timeSinceCreation = Date.now() - serverCreatedAt;
        const isInitializing = timeSinceCreation < 60000;

        const serverStatus = statusData.servers?.[statusIndex] || {};
        statusIndex++;

        if (serverStatus.online) {
          status = 'online';
          playerCount = serverStatus.players?.current || 0;
          currentMaxPlayers = serverStatus.players?.max || lobby.maxPlayers;
          currentMap = serverStatus.map || lobby.map;
        } else {
          status = isInitializing ? 'initializing' : 'offline';
        }
      }

      return {
        id: lobby.id,
        name: lobby.name,
        gameMode: lobby.gameMode,
        maxPlayers: currentMaxPlayers,
        map: currentMap,
        hasPassword: !!lobby.hasPassword,
        tempGameServerId: lobby.tempGameServerId,
        createdBy: lobby.createdBy,
        created_at: lobby.created_at,
        expires_at: lobby.expires_at,
        serverIp: lobby.serverIp,
        serverPort: lobby.serverPort,
        status,
        playerCount,
      };
    });

    return NextResponse.json({ lobbies: lobbiesWithStatus });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return NextResponse.json({ error: 'Failed to fetch lobbies' }, { status: 500 });
  }
}

export const POST = requireAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const body = await request.json();
    const { name, gameMode, maxPlayers, map, serverPassword } = body;

    if (!name || !gameMode || !maxPlayers || !map) {
      return NextResponse.json({ error: 'Tất cả thông tin là bắt buộc' }, { status: 400 });
    }

    if (!isValidGameMode(gameMode)) {
      return NextResponse.json({ error: 'Chế độ chơi không hợp lệ' }, { status: 400 });
    }

    if (!isValidCS2Map(map)) {
      return NextResponse.json({ error: 'Bản đồ không hợp lệ' }, { status: 400 });
    }

    if (maxPlayers < 2 || maxPlayers > 10) {
      return NextResponse.json({ error: 'Người chơi tối thiểu là 2, tối đa là 10' }, { status: 400 });
    }

    const existingLobby = await db.select()
      .from(lobbies)
      .where(and(eq(lobbies.createdBy, user.steamId), gt(lobbies.expires_at, new Date())))
      .limit(1);

    if (existingLobby.length > 0) {
      return NextResponse.json({ error: 'Không thể tạo lobby khi bạn đã có lobby khác hoạt động' }, { status: 400 });
    }

    const available = await findAvailableVpsAndPort();
    if (!available) {
      return NextResponse.json({ error: 'Hết slot, vui lòng chờ một chút.' }, { status: 503 });
    }

    const steamApiKey = await findAvailableSteamApiKey();
    if (!steamApiKey) {
      return NextResponse.json({ error: 'Hệ thống hết slot, vui lòng chờ.' }, { status: 503 });
    }

    const { vps, port } = available;
    const tempServerId = `lobby-${uuidv4().slice(0, 8)}`;
    const rconPassword = process.env.DEFAULT_RCON_PASSWORD || 'changeme';
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const vpsManager = new VpsManager(vps.ip, vps.port, vps.username, vps.privateKey);

    const spawnResult = await vpsManager.spawnNewServer({
      tempServerId,
      port,
      rconPassword,
      steamAccount: steamApiKey.steamAccount || process.env.STEAM_ACCOUNT || '',
      serverPassword: serverPassword || undefined,
      mode: gameMode,
      map,
      admins: [user.steamId],
    });

    if (spawnResult.stderr && !spawnResult.stdout) {
      console.error('Failed to spawn server:', spawnResult.stderr);
      return NextResponse.json({ error: 'Failed to spawn game server' }, { status: 500 });
    }

    const containerId = spawnResult.stdout.trim();

    const serverResult = await db.insert(tempGameServers).values({
      vpsId: vps.id,
      steamApiKeyId: steamApiKey.id,
      assignedPort: port,
      status: 'initializing',
      rconPassword,
      containerId,
      createdBy: user.steamId,
      expires_at: expiresAt,
    });

    const tempGameServerId = serverResult[0].insertId;

    const lobbyResult = await db.insert(lobbies).values({
      name,
      gameMode,
      maxPlayers,
      map,
      serverPassword: serverPassword || null,
      tempGameServerId,
      createdBy: user.steamId,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      lobby: {
        id: lobbyResult[0].insertId,
        name,
        gameMode,
        map,
        serverIp: vps.ip,
        serverPort: port,
        expiresAt: expiresAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
  }
});

