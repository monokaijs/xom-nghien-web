"use client";

import React, { useState, useEffect } from 'react';
import {IconBan, IconCheck, IconFilter, IconSearch, IconShield} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Select from '@/components/ui/Select';

interface User {
  steamid64: string;
  name: string;
  avatar: string;
  avatarfull: string;
  role: string;
  banned: boolean;
  lastUpdated: string;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} ngày trước`;
  if (diffHours > 0) return `${diffHours} giờ trước`;
  if (diffMins > 0) return `${diffMins} phút trước`;
  return 'Vừa xong';
};

export default function ManageUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const currentUserRole = session?.user?.role || 'user';
  const canBanUsers = currentUserRole === 'admin' || currentUserRole === 'moderator';
  const canChangeRoles = currentUserRole === 'admin';

  const totalPages = Math.ceil(total / usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [search, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', usersPerPage.toString());
      params.append('offset', ((currentPage - 1) * usersPerPage).toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (steamid: string, currentBanned: boolean) => {
    setActionLoading(steamid);
    try {
      const response = await fetch(`/api/admin/users/${steamid}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !currentBanned }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update ban status');
      }
    } catch (error) {
      console.error('Error updating ban status:', error);
      alert('Failed to update ban status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (steamid: string, newRole: string) => {
    setActionLoading(steamid);
    try {
      const response = await fetch(`/api/admin/users/${steamid}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingRole(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Quản Lý Người Dùng</h2>
          <p className="text-white/50 text-sm">
            Quản lý danh sách người dùng và phân quyền. Tổng: {total} người dùng
            {totalPages > 1 && ` - Trang ${currentPage}/${totalPages}`}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3"/>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, Steam ID..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Đang tải...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Không tìm thấy người dùng</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                <th className="px-6 py-4">Người Dùng</th>
                <th className="px-6 py-4">Steam ID</th>
                <th className="px-6 py-4">Vai Trò</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4">Đăng Nhập Cuối</th>
                <th className="px-6 py-4 text-right">Hành Động</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.steamid64} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                        <img
                          src={user.avatarfull || user.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                          }}
                        />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-white/70">{user.steamid64}</td>
                  <td className="px-6 py-4">
                    {canChangeRoles && editingRole === user.steamid64 ? (
                      <Select
                        size="sm"
                        options={[
                          { value: 'user', label: 'User' },
                          { value: 'moderator', label: 'Moderator' },
                          { value: 'admin', label: 'Admin' },
                        ]}
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.steamid64, e.target.value)}
                        disabled={actionLoading === user.steamid64}
                      />
                    ) : (
                      <button
                        onClick={() => canChangeRoles && setEditingRole(user.steamid64)}
                        disabled={!canChangeRoles}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                          user.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        } ${canChangeRoles ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        {user.role}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.banned ? 'bg-red-500' : 'bg-green-500'}`}/>
                      <span className={user.banned ? 'text-red-400' : 'text-green-400'}>
                        {user.banned ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/50 text-sm">{formatTimeAgo(user.lastUpdated)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canBanUsers && (user.role === 'user' || currentUserRole === 'admin') && (
                        user.banned ? (
                          <button
                            onClick={() => handleBanToggle(user.steamid64, user.banned)}
                            disabled={actionLoading === user.steamid64}
                            className="p-2 hover:bg-green-500/20 rounded-lg text-white/70 hover:text-green-400 transition-colors disabled:opacity-50"
                            title="Mở khóa">
                            <IconCheck size={18}/>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanToggle(user.steamid64, user.banned)}
                            disabled={actionLoading === user.steamid64}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Khóa tài khoản">
                            <IconBan size={18}/>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl border transition-colors ${
                      currentPage === page
                        ? 'bg-accent-primary border-accent-primary text-white font-bold'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="text-white/50">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
