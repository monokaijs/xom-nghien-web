import {NextRequest, NextResponse} from 'next/server';
import {GameDig} from 'gamedig';
import {GameServer, ServerStatus} from "@/types/server";
import {GameServers} from "@/config/servers";

let serverStatusCache: ServerStatus[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 10 * 1000; // 10 secs

async function queryServer(server: GameServer): Promise<ServerStatus> {
  const baseStatus: ServerStatus = {
    id: server.id,
    name: server.name,
    ip: server.internalIp,
    port: server.port,
    type: server.type,
    online: false,
    players: {current: 0, max: 0},
    lastUpdated: new Date().toISOString(),
  };

  try {
    const startTime = Date.now();
    const state = await GameDig.query({
      type: server.type,
      host: server.ip,
      port: server.port,
      socketTimeout: 1000,
      attemptTimeout: 1000,
      maxRetries: 1,
    });

    const ping = Date.now() - startTime;

    return {
      ...baseStatus,
      online: true,
      players: {
        current: state.players?.length || 0,
        max: state.maxplayers || 0,
        list: state.players?.map((player: any) => ({
          name: player.name || 'Unknown',
          raw: {
            score: player.raw?.score,
            time: player.raw?.time,
          }
        })) || [],
      },
      map: state.map || undefined,
      ping,
    };
  } catch (error) {
    console.error(`Error querying server ${server.name}:`, error);
    return {
      ...baseStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function queryAllServers(): Promise<ServerStatus[]> {
  const servers: any[] = GameServers;

  if (servers.length === 0) {
    return [];
  }

  // Query all servers in parallel
  const promises = servers.map(server => queryServer(server));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Fallback for rejected promises
      const server = servers[index];
      return {
        id: server.id,
        name: server.name,
        ip: server.ip,
        port: server.port,
        type: server.type,
        online: false,
        players: {current: 0, max: 0},
        map: server.map!,
        lastUpdated: new Date().toISOString(),
        error: 'Query failed',
      };
    }
  });
}

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || serverStatusCache.length === 0) {
      console.log('Refreshing server status cache...');
      serverStatusCache = await queryAllServers();
      lastCacheUpdate = now;
    }

    // Set cache headers for client-side caching
    const response = NextResponse.json({
      servers: serverStatusCache,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
      nextUpdate: new Date(lastCacheUpdate + CACHE_DURATION).toISOString(),
    });

    // Cache for 30 seconds on client side, but allow stale content for up to 1 minute
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Error in servers API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch server status',
        servers: [],
        lastUpdated: new Date().toISOString(),
      },
      {status: 500}
    );
  }
}

// POST endpoint for manual refresh
export async function POST() {
  try {
    console.log('Manual refresh requested...');
    serverStatusCache = await queryAllServers();
    lastCacheUpdate = Date.now();

    return NextResponse.json({
      message: 'Server status refreshed',
      servers: serverStatusCache,
      lastUpdated: new Date(lastCacheUpdate).toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing servers:', error);
    return NextResponse.json(
      {error: 'Failed to refresh server status'},
      {status: 500}
    );
  }
}
