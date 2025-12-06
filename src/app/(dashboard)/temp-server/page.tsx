"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IconServer, IconClock, IconUsers, IconMap, IconRefresh, IconCopy, IconCheck, IconPlayerPlay } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

interface TempServer {
  id: number;
  vpsId: number;
  assignedPort: number;
  status: string;
  rconPassword: string;
  created_at: string;
  expires_at: string;
  vpsIp: string;
  vpsName: string;
}

interface ServerStatus {
  status: string;
  playerCount: number;
  maxPlayers: number;
  mapName: string;
  serverName: string;
}

export default function TempServerPage() {
  const { data: session, status: authStatus } = useSession();
  const [servers, setServers] = useState<TempServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<Record<number, ServerStatus>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch('/api/temp-servers');
      const data = await response.json();
      setServers(data.servers || []);
    } catch (err) {
      console.error('Error fetching servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServerStatus = useCallback(async (serverId: number) => {
    try {
      const response = await fetch(`/api/temp-servers/${serverId}/status`);
      const data = await response.json();
      setServerStatus(prev => ({ ...prev, [serverId]: data }));
    } catch (err) {
      console.error('Error fetching server status:', err);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchServers();
    }
  }, [authStatus, fetchServers]);

  useEffect(() => {
    servers.forEach(server => {
      fetchServerStatus(server.id);
    });
    const interval = setInterval(() => {
      servers.forEach(server => {
        fetchServerStatus(server.id);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [servers, fetchServerStatus]);

  const handleCreateServer = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/temp-servers', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        fetchServers();
      } else {
        setError(data.error || 'Failed to create server');
      }
    } catch (err) {
      setError('Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (authStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-[400px] text-white/60">Đang tải...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-yellow-400 text-center">
          <p>Vui lòng đăng nhập để sử dụng tính năng này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Thuê Server Tạm Thời</h1>
          <p className="text-white/50">Thuê server CS2 miễn phí trong 2 giờ</p>
        </div>
        {servers.length === 0 && (
          <button
            onClick={handleCreateServer}
            disabled={creating}
            className="bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <IconPlayerPlay size={20} />
            {creating ? 'Đang tạo...' : 'Thuê Server Ngay'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-8 text-center text-white/50">Đang tải...</div>
      ) : servers.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
          <IconServer size={48} className="mx-auto text-white/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có server nào</h3>
          <p className="text-white/50 mb-6">Nhấn nút "Thuê Server Ngay" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              status={serverStatus[server.id]}
              onRefresh={() => fetchServerStatus(server.id)}
              onCopy={copyToClipboard}
              copiedField={copiedField}
              formatTimeRemaining={formatTimeRemaining}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ServerCardProps {
  server: TempServer;
  status?: ServerStatus;
  onRefresh: () => void;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  formatTimeRemaining: (expiresAt: string) => string;
}

function ServerCard({ server, status, onRefresh, onCopy, copiedField, formatTimeRemaining }: ServerCardProps) {
  const connectAddress = `${server.vpsIp}:${server.assignedPort}`;
  const consoleCommand = `connect ${connectAddress}`;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent-primary/20 rounded-xl flex items-center justify-center">
            <IconServer size={24} className="text-accent-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{server.vpsName}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${status?.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white/60">{status?.status === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button onClick={onRefresh} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
          <IconRefresh size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <IconClock size={14} /> Thời gian còn lại
          </div>
          <div className="font-medium">{formatTimeRemaining(server.expires_at)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <IconUsers size={14} /> Người chơi
          </div>
          <div className="font-medium">{status?.playerCount || 0}/{status?.maxPlayers || 10}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <IconMap size={14} /> Map
          </div>
          <div className="font-medium truncate">{status?.mapName || 'N/A'}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-white/50 text-xs mb-1">Port</div>
          <div className="font-medium font-mono">{server.assignedPort}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-lg px-4 py-2 font-mono text-sm">{connectAddress}</div>
          <button
            onClick={() => onCopy(connectAddress, `addr-${server.id}`)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {copiedField === `addr-${server.id}` ? <IconCheck size={18} className="text-green-400" /> : <IconCopy size={18} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-lg px-4 py-2 font-mono text-sm">{consoleCommand}</div>
          <button
            onClick={() => onCopy(consoleCommand, `cmd-${server.id}`)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {copiedField === `cmd-${server.id}` ? <IconCheck size={18} className="text-green-400" /> : <IconCopy size={18} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">RCON Password:</span>
          <div className="flex-1 bg-white/10 rounded-lg px-4 py-2 font-mono text-sm">{server.rconPassword}</div>
          <button
            onClick={() => onCopy(server.rconPassword, `rcon-${server.id}`)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {copiedField === `rcon-${server.id}` ? <IconCheck size={18} className="text-green-400" /> : <IconCopy size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
