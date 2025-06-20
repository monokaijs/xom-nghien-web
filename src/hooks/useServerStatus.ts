import { useState, useEffect, useCallback } from 'react';
import { ServerStatus, ServerResponse } from '@/types/server';

interface UseServerStatusReturn {
  servers: ServerStatus[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  nextUpdate: string | null;
  refresh: () => Promise<void>;
}

export function useServerStatus(autoRefresh = true): UseServerStatusReturn {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  const fetchServers = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setIsLoading(true);
      }

      const url = forceRefresh ? '/api/servers?refresh=true' : '/api/servers';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ServerResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setServers(data.servers);
      setLastUpdated(data.lastUpdated);
      setNextUpdate(data.nextUpdate || null);
    } catch (err) {
      console.error('Error fetching server status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch server status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchServers(true);
  }, [fetchServers]);

  // Initial fetch
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchServers();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [autoRefresh, fetchServers]);

  // Auto-refresh based on nextUpdate time
  useEffect(() => {
    if (!autoRefresh || !nextUpdate) return;

    const nextUpdateTime = new Date(nextUpdate).getTime();
    const now = Date.now();
    const timeUntilUpdate = nextUpdateTime - now;

    if (timeUntilUpdate > 0 && timeUntilUpdate < 120000) { // Less than 2 minutes
      const timeout = setTimeout(() => {
        fetchServers();
      }, timeUntilUpdate);

      return () => clearTimeout(timeout);
    }
  }, [autoRefresh, nextUpdate, fetchServers]);

  return {
    servers,
    isLoading,
    error,
    lastUpdated,
    nextUpdate,
    refresh,
  };
}
