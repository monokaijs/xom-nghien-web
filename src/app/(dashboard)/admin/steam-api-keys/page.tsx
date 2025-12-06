"use client";

import React, { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconKey, IconCheck, IconX } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

interface SteamApiKey {
  id: number;
  name: string;
  steam_account: string | null;
  is_active: number;
  active_servers: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  steamAccount: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  steamAccount: '',
  isActive: true,
};

export default function SteamApiKeysPage() {
  const { data: session } = useSession();
  const [keysList, setKeysList] = useState<SteamApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState<SteamApiKey | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchKeys();
  }, [search]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await fetch(`/api/admin/steam-api-keys?${params}`);
      const data = await response.json();
      setKeysList(data.steamApiKeys || []);
    } catch (error) {
      console.error('Error fetching Steam API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingKey?.id || -1);

    try {
      const url = editingKey ? `/api/admin/steam-api-keys/${editingKey.id}` : '/api/admin/steam-api-keys';
      const response = await fetch(url, {
        method: editingKey ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setEditingKey(null);
        setFormData(initialFormData);
        fetchKeys();
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving Steam API key:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa API key này?')) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/steam-api-keys/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchKeys();
      } else {
        alert('Có lỗi xảy ra khi xóa API key');
      }
    } catch (error) {
      console.error('Error deleting Steam API key:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (key: SteamApiKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      steamAccount: key.steam_account || '',
      isActive: key.is_active === 1,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingKey(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const maskGSLT = (gslt: string) => {
    if (gslt.length <= 8) return '****';
    return gslt.slice(0, 4) + '****' + gslt.slice(-4);
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
          <h2 className="text-xl font-bold mb-1">Quản Lý Steam API Keys</h2>
          <p className="text-white/50 text-sm">
            Quản lý danh sách Steam API keys cho game server. Tổng: {keysList.length} keys
          </p>
        </div>
        <button onClick={openAddModal} className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <IconPlus size={20} />
          Thêm API Key
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3"/>
          <input type="text" placeholder="Tìm kiếm theo tên..." className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">GSLT</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Đang sử dụng</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-white/50">Đang tải...</td></tr>
              ) : keysList.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-white/50">Không tìm thấy GSLT nào</td></tr>
              ) : (
                keysList.map((key) => (
                  <tr key={key.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                          <IconKey size={20} className="text-accent-primary" />
                        </div>
                        <span className="font-medium">{key.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-white/70">{key.steam_account ? maskGSLT(key.steam_account) : '-'}</td>
                    <td className="px-6 py-4">
                      {key.is_active ? (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><IconCheck size={14} /> Active</span>
                      ) : (
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><IconX size={14} /> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {key.active_servers > 0 ? (
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">{key.active_servers} server(s)</span>
                      ) : (
                        <span className="text-white/50">Không</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(key)} disabled={actionLoading === key.id} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"><IconEdit size={18} /></button>
                        <button onClick={() => handleDelete(key.id)} disabled={actionLoading === key.id || key.active_servers > 0} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"><IconTrash size={18} /></button>
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
          <div className="bg-bg-panel rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">{editingKey ? 'Chỉnh sửa GSLT' : 'Thêm GSLT Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" placeholder="VD: GSLT #1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GSLT (Game Server Login Token) *</label>
                <input type="text" required value={formData.steamAccount} onChange={(e) => setFormData({ ...formData, steamAccount: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/50" placeholder="Game Server Login Token" />
                <p className="text-xs text-white/50 mt-1">Steam Web API Key sẽ được lấy từ biến môi trường</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="isActive" className="text-sm">Kích hoạt</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={actionLoading !== null} className="flex-1 bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">{actionLoading !== null ? 'Đang xử lý...' : editingKey ? 'Cập nhật' : 'Thêm'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingKey(null); }} disabled={actionLoading !== null} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

