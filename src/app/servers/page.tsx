'use client';

import { useState } from 'react';
import { RefreshCwIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import GameServerCard from '@/components/GameServerCard';
import { useServerStatus } from '@/hooks/useServerStatus';
import { Button } from '@/components/ui/button';

export default function ServersPage() {
  const { servers, isLoading, error, lastUpdated, nextUpdate, refresh } = useServerStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const onlineServers = servers.filter(server => server.online);
  const offlineServers = servers.filter(server => !server.online);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Game Servers</h1>
              <p className="text-slate-400 mt-1">Monitor and connect to our game servers</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-slate-700 hover:bg-red-600 text-white transition-colors"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{onlineServers.length} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-red-400" />
                <span className="text-white font-medium">{offlineServers.length} Offline</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <ClockIcon className="w-4 h-4" />
              {lastUpdated ? (
                <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
              ) : (
                <span>Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircleIcon className="w-5 h-5" />
              <span className="font-medium">Error loading server status</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
            <Button
              onClick={handleRefresh}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && servers.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <GameServerCard
                key={index}
                server={{} as any}
                isLoading={true}
              />
            ))}
          </div>
        )}

        {/* Server Cards */}
        {!isLoading && servers.length > 0 && (
          <div className="space-y-8">
            {/* Online Servers */}
            {onlineServers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                  Online Servers ({onlineServers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {onlineServers.map((server) => (
                    <GameServerCard key={server.id} server={server} />
                  ))}
                </div>
              </section>
            )}

            {/* Offline Servers */}
            {offlineServers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircleIcon className="w-6 h-6 text-red-400" />
                  Offline Servers ({offlineServers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offlineServers.map((server) => (
                    <GameServerCard key={server.id} server={server} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && servers.length === 0 && !error && (
          <div className="text-center py-12">
            <AlertCircleIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No servers configured</h3>
            <p className="text-slate-400">Check your server configuration file.</p>
          </div>
        )}

        {/* Auto-refresh info */}
        {nextUpdate && (
          <div className="mt-8 text-center text-slate-500 text-sm">
            Next automatic update: {new Date(nextUpdate).toLocaleTimeString()}
          </div>
        )}
      </main>
    </div>
  );
}
