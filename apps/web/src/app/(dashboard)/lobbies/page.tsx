"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { IconAlertCircle, IconMap, IconPlayerPlayFilled, IconRefresh, IconServer, IconUsers } from '@tabler/icons-react';
import { connectToServer } from '@/lib/connectToServer';
import { CS2_MAP_LABELS, CS2_MODE_LABELS } from '@xom/game-config';

interface PublicGameServer {
  id: number;
  name: string;
  gameKey: string;
  status: string;
  connectAddress: string | null;
  queryPort: number | null;
  configSnapshot: Record<string, any>;
  hostName: string;
  configurationName: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<PublicGameServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/game-servers');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load servers');
      setServers(data.servers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 15000);
    return () => clearInterval(interval);
  }, [fetchServers]);

  const handleConnect = (server: PublicGameServer) => {
    if (!server.connectAddress) return;
    const [ip, port] = server.connectAddress.split(':');
    connectToServer(ip, port, '', server.gameKey === 'cs2' ? '730' : '730');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Game Servers</h1>
          <p className="text-white/50">Danh sách server đang được hệ thống quản lý</p>
        </div>
        <button
          onClick={fetchServers}
          className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <IconRefresh size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center gap-2">
          <IconAlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/50">Đang tải...</div>
      ) : servers.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
          <IconServer size={48} className="mx-auto text-white/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có server</h3>
          <p className="text-white/50">Admin có thể deploy server trong trang quản trị.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {servers.map((server) => {
            const isOnline = server.status === 'online';
            const map = server.configSnapshot?.map as keyof typeof CS2_MAP_LABELS;
            const mode = server.configSnapshot?.mode as keyof typeof CS2_MODE_LABELS;
            const maxPlayers = Number(server.configSnapshot?.maxPlayers || 0);

            return (
              <div key={server.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : server.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <h3 className="font-semibold truncate">{server.configurationName}</h3>
                    </div>
                    <p className="text-sm text-white/50 truncate">{server.hostName}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70 capitalize">{server.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-white/5 rounded-xl p-3 min-w-0">
                    <div className="text-white/40 text-xs mb-1">Mode</div>
                    <div className="truncate">{CS2_MODE_LABELS[mode] || mode || '-'}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 min-w-0">
                    <div className="text-white/40 text-xs mb-1 flex items-center gap-1"><IconMap size={13} /> Map</div>
                    <div className="truncate">{CS2_MAP_LABELS[map] || map || '-'}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 min-w-0">
                    <div className="text-white/40 text-xs mb-1 flex items-center gap-1"><IconUsers size={13} /> Slots</div>
                    <div>{maxPlayers || '-'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/20 rounded-lg px-3 py-2 font-mono text-sm truncate">
                    {server.connectAddress || 'Pending'}
                  </div>
                  <button
                    disabled={!isOnline || !server.connectAddress}
                    onClick={() => handleConnect(server)}
                    className="w-10 h-10 rounded-lg bg-accent-primary text-white flex items-center justify-center hover:bg-accent-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Connect"
                  >
                    <IconPlayerPlayFilled size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
