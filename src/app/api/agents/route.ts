import { NextRequest, NextResponse } from 'next/server';
import { CS2Agent } from '@/types/server';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/main/src/data';

// Cache for agents data
let agentsCache: CS2Agent[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchAgentsData(): Promise<CS2Agent[]> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/agents.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching agents data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team'); // 2 for T, 3 for CT
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const now = Date.now();
    
    // Check if we need to refresh the cache
    if (forceRefresh || now - lastCacheUpdate > CACHE_DURATION || agentsCache.length === 0) {
      console.log('Refreshing agents cache...');
      agentsCache = await fetchAgentsData();
      lastCacheUpdate = now;
    }
    
    let responseData;
    
    if (team) {
      const teamNumber = parseInt(team);
      const filteredAgents = agentsCache.filter(agent => agent.team === teamNumber);
      responseData = {
        team: teamNumber,
        agents: filteredAgents,
        total: filteredAgents.length,
      };
    } else {
      const terroristAgents = agentsCache.filter(agent => agent.team === 2);
      const counterTerroristAgents = agentsCache.filter(agent => agent.team === 3);
      
      responseData = {
        terrorist: terroristAgents,
        counterTerrorist: counterTerroristAgents,
        total: agentsCache.length,
        lastUpdated: new Date(lastCacheUpdate).toISOString(),
      };
    }
    
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents data' },
      { status: 500 }
    );
  }
}
