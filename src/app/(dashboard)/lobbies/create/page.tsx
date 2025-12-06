"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

const GAME_MODES = [
  { value: 'competitive', label: 'Competitive' },
  { value: 'wingman', label: 'Wingman' },
  { value: 'deathmatch', label: 'Death Match' },
  { value: '1v1', label: 'Solo (1v1)' },
  { value: 'gg', label: 'Gun Game' },
];

const CS2_MAPS = [
  { value: 'de_dust2', label: 'Dust II' },
  { value: 'de_mirage', label: 'Mirage' },
  { value: 'de_inferno', label: 'Inferno' },
  { value: 'de_nuke', label: 'Nuke' },
  { value: 'de_overpass', label: 'Overpass' },
  { value: 'de_ancient', label: 'Ancient' },
  { value: 'de_anubis', label: 'Anubis' },
  { value: 'de_vertigo', label: 'Vertigo' },
  { value: 'cs_office', label: 'Office' },
  { value: 'cs_italy', label: 'Italy' },
];

interface FormData {
  name: string;
  gameMode: string;
  maxPlayers: number;
  map: string;
  serverPassword: string;
}

export default function CreateLobbyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gameMode: 'competitive',
    maxPlayers: 10,
    map: 'de_dust2',
    serverPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/lobbies');
      } else {
        setError(data.error || 'Failed to create lobby');
      }
    } catch (err) {
      setError('Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-[400px] text-white/60">Đang tải...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-yellow-400 text-center">
          <p>Vui lòng đăng nhập để tạo lobby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link href="/lobbies" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4">
          <IconArrowLeft size={20} />
          Quay lại danh sách lobby
        </Link>
        <h1 className="text-2xl font-bold mb-1">Tạo Lobby Mới</h1>
        <p className="text-white/50">Tạo một lobby game và mời bạn bè tham gia</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Tên Lobby *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            placeholder="VD: Lobby của tôi"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Game Mode *</label>
            <select
              required
              value={formData.gameMode}
              onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            >
              {GAME_MODES.map(mode => (
                <option key={mode.value} value={mode.value} className="bg-bg-panel">{mode.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Số người chơi tối đa *</label>
            <input
              type="number"
              required
              min={2}
              max={10}
              value={formData.maxPlayers}
              onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Map *</label>
          <select
            required
            value={formData.map}
            onChange={(e) => setFormData({ ...formData, map: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            {CS2_MAPS.map(map => (
              <option key={map.value} value={map.value} className="bg-bg-panel">{map.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mật khẩu server (tùy chọn)</label>
          <input
            type="text"
            value={formData.serverPassword}
            onChange={(e) => setFormData({ ...formData, serverPassword: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            placeholder="Để trống nếu không cần mật khẩu"
          />
          <p className="text-xs text-white/50 mt-1">Người chơi sẽ cần nhập mật khẩu này để vào server</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang tạo lobby...' : 'Tạo Lobby'}
          </button>
        </div>
      </form>
    </div>
  );
}

