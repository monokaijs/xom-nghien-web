"use client";

import React, { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconServer, IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

interface VpsInstance {
  id: number;
  name: string;
  ip: string;
  port: number;
  username: string;
  open_port_range_start: number;
  open_port_range_end: number;
  max_game_instances: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  ip: string;
  port: number;
  username: string;
  privateKey: string;
  openPortRangeStart: number;
  openPortRangeEnd: number;
  maxGameInstances: number;
}

const initialFormData: FormData = {
  name: '',
  ip: '',
  port: 22,
  username: 'root',
  privateKey: '',
  openPortRangeStart: 27015,
  openPortRangeEnd: 27100,
  maxGameInstances: 5,
};

export default function VpsManagementPage() {
  const { data: session } = useSession();
  const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVps, setEditingVps] = useState<VpsInstance | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [keyFileName, setKeyFileName] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchVpsList();
  }, [search]);

  const fetchVpsList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await fetch(`/api/admin/vps?${params}`);
      const data = await response.json();
      setVpsList(data.vpsInstances || []);
    } catch (error) {
      console.error('Error fetching VPS list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKeyFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData({ ...formData, privateKey: content });
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingVps?.id || -1);
    setValidationStatus('validating');
    setValidationError('');

    try {
      const url = editingVps ? `/api/admin/vps/${editingVps.id}` : '/api/admin/vps';
      const payload = { ...formData };
      if (editingVps && !formData.privateKey) {
        delete (payload as any).privateKey;
      }

      const response = await fetch(url, {
        method: editingVps ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setValidationStatus('success');
        setTimeout(() => {
          setShowModal(false);
          setEditingVps(null);
          setFormData(initialFormData);
          setKeyFileName('');
          setValidationStatus('idle');
          fetchVpsList();
        }, 1000);
      } else {
        setValidationStatus('error');
        setValidationError(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving VPS:', error);
      setValidationStatus('error');
      setValidationError('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa VPS này?')) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/vps/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchVpsList();
      } else {
        alert('Có lỗi xảy ra khi xóa VPS');
      }
    } catch (error) {
      console.error('Error deleting VPS:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (vps: VpsInstance) => {
    setEditingVps(vps);
    setFormData({
      name: vps.name,
      ip: vps.ip,
      port: vps.port,
      username: vps.username,
      privateKey: '',
      openPortRangeStart: vps.open_port_range_start,
      openPortRangeEnd: vps.open_port_range_end,
      maxGameInstances: vps.max_game_instances,
    });
    setKeyFileName('');
    setValidationStatus('idle');
    setValidationError('');
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingVps(null);
    setFormData(initialFormData);
    setKeyFileName('');
    setValidationStatus('idle');
    setValidationError('');
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
          <h2 className="text-xl font-bold mb-1">Quản Lý VPS</h2>
          <p className="text-white/50 text-sm">
            Quản lý danh sách VPS cho game server. Tổng: {vpsList.length} VPS
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <IconPlus size={20} />
          Thêm VPS
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3"/>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, IP..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                <th className="px-6 py-4">Tên VPS</th>
                <th className="px-6 py-4">IP:Port</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Port Range</th>
                <th className="px-6 py-4">Max Instances</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/50">Đang tải...</td>
                </tr>
              ) : vpsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/50">Không tìm thấy VPS nào</td>
                </tr>
              ) : (
                vpsList.map((vps) => (
                  <tr key={vps.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                          <IconServer size={20} className="text-accent-primary" />
                        </div>
                        <span className="font-medium">{vps.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-white/70">{vps.ip}:{vps.port}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{vps.username}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{vps.open_port_range_start} - {vps.open_port_range_end}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{vps.max_game_instances}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(vps)}
                          disabled={actionLoading === vps.id}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <IconEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(vps.id)}
                          disabled={actionLoading === vps.id}
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
        <VpsModal
          editingVps={editingVps}
          formData={formData}
          setFormData={setFormData}
          keyFileName={keyFileName}
          handleFileUpload={handleFileUpload}
          handleSubmit={handleSubmit}
          actionLoading={actionLoading}
          validationStatus={validationStatus}
          validationError={validationError}
          onClose={() => { setShowModal(false); setEditingVps(null); }}
        />
      )}
    </div>
  );
}

interface VpsModalProps {
  editingVps: VpsInstance | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  keyFileName: string;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  actionLoading: number | null;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationError: string;
  onClose: () => void;
}

function VpsModal({ editingVps, formData, setFormData, keyFileName, handleFileUpload, handleSubmit, actionLoading, validationStatus, validationError, onClose }: VpsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-panel rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{editingVps ? 'Chỉnh sửa VPS' : 'Thêm VPS Mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên VPS *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" placeholder="VD: VPS-01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IP Address *</label>
              <input type="text" required value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/50" placeholder="VD: 103.163.214.151" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SSH Port *</label>
              <input type="number" required value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Private Key (PEM) {!editingVps && '*'}</label>
              <label className="flex items-center gap-2 text-sm text-accent-primary cursor-pointer hover:text-accent-primary/80 transition-colors">
                <IconUpload size={16} />
                <span>{keyFileName || 'Upload file'}</span>
                <input type="file" accept=".pem,.key,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 min-h-[120px] resize-y"
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
            />
            {editingVps && <p className="text-xs text-white/50 mt-1">Để trống nếu không muốn thay đổi key</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Port Range Start *</label>
              <input type="number" required value={formData.openPortRangeStart} onChange={(e) => setFormData({ ...formData, openPortRangeStart: parseInt(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Port Range End *</label>
              <input type="number" required value={formData.openPortRangeEnd} onChange={(e) => setFormData({ ...formData, openPortRangeEnd: parseInt(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Instances *</label>
              <input type="number" required value={formData.maxGameInstances} onChange={(e) => setFormData({ ...formData, maxGameInstances: parseInt(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50" />
            </div>
          </div>
          {validationStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <IconX size={18} /> {validationError}
            </div>
          )}
          {validationStatus === 'validating' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-400 text-sm">Đang kiểm tra kết nối SSH...</div>
          )}
          {validationStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
              <IconCheck size={18} /> Kết nối SSH thành công!
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={actionLoading !== null || (!editingVps && !formData.privateKey)} className="flex-1 bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {actionLoading !== null ? 'Đang xử lý...' : editingVps ? 'Cập nhật' : 'Thêm'}
            </button>
            <button type="button" onClick={onClose} disabled={actionLoading !== null} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

