"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IconPlus, IconLock, IconUsers, IconMap, IconPlayerPlayFilled, IconRefresh, IconX } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getMapImage } from '@/lib/utils/mapImage';
import { connectToServer } from '@/lib/connectToServer';

interface Lobby {
  id: number;
  name: string;
  gameMode: string;
  maxPlayers: number;
  map: string;
  hasPassword: boolean;
  tempGameServerId: number | null;
  createdBy: string;
  created_at: string;
  expires_at: string;
  serverIp: string | null;
  serverPort: number | null;
  status: string;
  playerCount: number;
}

const GAME_MODE_LABELS: Record<string, string> = {
  competitive: 'Competitive',
  wingman: 'Wingman',
  deathmatch: 'Death Match',
  '1v1': 'Solo (1v1)',
  gg: 'Gun Game',
};

export default function LobbiesPage() {
  const { data: session } = useSession();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLobbies = useCallback(async () => {
    try {
      const response = await fetch('/api/lobbies');
      const data = await response.json();
      setLobbies(data.lobbies || []);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 15000);
    return () => clearInterval(interval);
  }, [fetchLobbies]);

  const getStatusColor = (status: string) => {
    if (status === 'online') return 'border-green-500/30 bg-green-500/20 text-green-300';
    if (status === 'initializing') return 'border-yellow-500/30 bg-yellow-500/20 text-yellow-300';
    return 'border-red-500/30 bg-red-500/20 text-red-300';
  };

  const getStatusText = (status: string) => {
    if (status === 'online') return 'Online';
    if (status === 'initializing') return 'Đang khởi tạo...';
    return 'Offline';
  };

  const handleConnect = (lobby: Lobby) => {
    if (lobby.serverIp && lobby.serverPort) {
      connectToServer(lobby.serverIp, lobby.serverPort);
    }
  };

  const handleDeleteLobby = async (lobbyId: number) => {
    if (!confirm('Bạn có chắc chắn muốn đóng lobby này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lobbies/${lobbyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLobbies();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete lobby');
      }
    } catch (error) {
      console.error('Error deleting lobby:', error);
      alert('Failed to delete lobby');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Lobbies</h1>
          <p className="text-white/50">Tham gia hoặc tạo lobby game mới</p>
        </div>
        {session && (
          <Link
            href="/lobbies/create"
            className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <IconPlus size={20} />
            Tạo Lobby
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/50">Đang tải...</div>
      ) : lobbies.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
          <IconUsers size={48} className="mx-auto text-white/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có lobby nào</h3>
          <p className="text-white/50 mb-6">Hãy tạo lobby đầu tiên!</p>
          {session && (
            <Link href="/lobbies/create" className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-3 rounded-lg transition-colors">
              <IconPlus size={20} /> Tạo Lobby
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {lobbies.map(lobby => (
            <LobbyCard
              key={lobby.id}
              lobby={lobby}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              onConnect={() => handleConnect(lobby)}
              onDelete={() => handleDeleteLobby(lobby.id)}
              isOwner={session?.user?.steamId === lobby.createdBy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LobbyCardProps {
  lobby: Lobby;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onConnect: () => void;
  onDelete: () => void;
  isOwner: boolean;
}

function LobbyCard({ lobby, getStatusColor, getStatusText, onConnect, onDelete, isOwner }: LobbyCardProps) {
  const isOnline = lobby.status === 'online';

  return (
    <div className="group flex rounded-2xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300">
      <div
        className="w-48 h-32 bg-cover bg-center flex-shrink-0 relative"
        style={{ backgroundImage: `url(${getMapImage(lobby.map)}), url(https://images.gamebanana.com/img/ss/mods/647fce8887e89.jpg)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-dark/80"></div>
      </div>
      <div className="flex-1 p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {lobby.hasPassword && <IconLock size={14} className="text-yellow-400 flex-shrink-0" />}
            <h4 className="font-semibold truncate">{lobby.name}</h4>
            <div className={`px-2 py-0.5 border rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(lobby.status)}`}>
              {getStatusText(lobby.status)}
            </div>
          </div>
          <div className="flex gap-2 text-xs flex-wrap">
            <div className="px-2 py-0.5 border border-white/10 rounded-full text-white/70">
              {GAME_MODE_LABELS[lobby.gameMode] || lobby.gameMode}
            </div>
            <div className="px-2 py-0.5 border border-white/10 rounded-full text-white/70 flex items-center gap-1">
              <IconMap size={12} /> {lobby.map}
            </div>
            {lobby.serverIp && lobby.serverPort && (
              <div className="px-2 py-0.5 border border-white/10 rounded-full text-white/70">
                {lobby.serverIp}:{lobby.serverPort}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-white/50 mb-0.5">Người Chơi</div>
            <div className="text-lg font-bold">
              {isOnline ? `${lobby.playerCount}/${lobby.maxPlayers}` : '--/--'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="w-10 h-10 rounded-full bg-accent-primary text-white flex items-center justify-center hover:bg-[#ff6b76] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isOnline}
              onClick={(e) => { e.stopPropagation(); onConnect(); }}
            >
              <IconPlayerPlayFilled size={16} />
            </button>
            {isOwner && (
              <button
                className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <IconX size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

