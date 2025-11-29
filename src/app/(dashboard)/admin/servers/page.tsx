"use client";

import React, { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconServer } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Select from '@/components/ui/Select';

interface Server {
  id: number;
  name: string;
  game: string;
  address: string;
  description: string | null;
  rcon_password: string | null;
  created_at: string;
  updated_at: string;
}

const GAME_OPTIONS = [
  { value: '', label: 'Tất cả game' },
  { value: 'CS2', label: 'Counter-Strike 2' },
  { value: 'CSGO', label: 'CS:GO' },
  { value: 'Minecraft', label: 'Minecraft' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Other', label: 'Khác' },
];

export default function ServersManagementPage() {
  const { data: session } = useSession();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    game: 'CS2',
    address: '',
    description: '',
    rcon_password: '',
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchServers();
  }, [search, gameFilter]);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (gameFilter) params.append('game', gameFilter);

      const response = await fetch(`/api/admin/servers?${params}`);
      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingServer?.id || -1);

    try {
      const url = editingServer
        ? `/api/admin/servers/${editingServer.id}`
        : '/api/admin/servers';

      const response = await fetch(url, {
        method: editingServer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingServer(null);
        setFormData({ name: '', game: 'CS2', address: '', description: '', rcon_password: '' });
        fetchServers();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving server:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa server này?')) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/servers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServers();
      } else {
        alert('Có lỗi xảy ra khi xóa server');
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (server: Server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      game: server.game,
      address: server.address,
      description: server.description || '',
      rcon_password: server.rcon_password || '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingServer(null);
    setFormData({ name: '', game: 'CS2', address: '', description: '', rcon_password: '' });
    setShowModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          Bạn không có quyền truy cập trang này
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Quản Lý Server</h2>
          <p className="text-white/50 text-sm">
            Quản lý danh sách server game. Tổng: {servers.length} server
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <IconPlus size={20} />
          Thêm Server
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3"/>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={GAME_OPTIONS}
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          size="sm"
        />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                <th className="px-6 py-4">Tên Server</th>
                <th className="px-6 py-4">Game</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                    Đang tải...
                  </td>
                </tr>
              ) : servers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                    Không tìm thấy server nào
                  </td>
                </tr>
              ) : (
                servers.map((server) => (
                  <tr key={server.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                          <IconServer size={20} className="text-accent-primary" />
                        </div>
                        <span className="font-medium">{server.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                        {server.game}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-white/70">{server.address}</td>
                    <td className="px-6 py-4 text-sm text-white/70 max-w-xs truncate">
                      {server.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(server)}
                          disabled={actionLoading === server.id}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <IconEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(server.id)}
                          disabled={actionLoading === server.id}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <IconTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-panel rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingServer ? 'Chỉnh sửa Server' : 'Thêm Server Mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên Server *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="VD: Xóm Nghiện #1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Game *</label>
                <Select
                  options={GAME_OPTIONS.filter(opt => opt.value !== '')}
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Địa chỉ (IP:PORT) *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="VD: 103.163.214.151:27015"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 min-h-[100px]"
                  placeholder="Mô tả về server..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">RCON Password</label>
                <input
                  type="password"
                  value={formData.rcon_password}
                  onChange={(e) => setFormData({ ...formData, rcon_password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="flex-1 bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading !== null ? 'Đang xử lý...' : editingServer ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingServer(null);
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

