import React from 'react';
import { IconSearch, IconFilter, IconEdit, IconTrash, IconBan, IconCheck } from '@tabler/icons-react';

export default function ManageUsersPage() {
    const users = [
        { id: 1, name: 'monokaijs', steamId: '76561198874901279', role: 'Admin', status: 'Active', lastLogin: '2 phút trước' },
        { id: 2, name: 's1mple', steamId: '76561198034202275', role: 'User', status: 'Active', lastLogin: '1 giờ trước' },
        { id: 3, name: 'ZywOo', steamId: '76561198145689231', role: 'User', status: 'Active', lastLogin: '5 giờ trước' },
        { id: 4, name: 'NiKo', steamId: '76561198041683378', role: 'User', status: 'Banned', lastLogin: '2 ngày trước' },
        { id: 5, name: 'm0NESY', steamId: '76561198323452712', role: 'VIP', status: 'Active', lastLogin: '1 ngày trước' },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold mb-1">Quản Lý Người Dùng</h2>
                    <p className="text-white/50 text-sm">Quản lý danh sách người dùng và phân quyền.</p>
                </div>
                <button className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                    Thêm Người Dùng
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
                    <IconSearch size={20} className="text-white/40 mr-3" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, Steam ID..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
                    />
                </div>
                <button className="bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-white/5 transition-colors">
                    <IconFilter size={20} />
                    <span>Bộ Lọc</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex-1">
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
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-white/70">{user.steamId}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${user.role === 'Admin' ? 'bg-red-500/20 text-red-400' :
                                                user.role === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className={user.status === 'Active' ? 'text-green-400' : 'text-red-400'}>
                                                {user.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white/50 text-sm">{user.lastLogin}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Chỉnh sửa">
                                                <IconEdit size={18} />
                                            </button>
                                            {user.status === 'Active' ? (
                                                <button className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors" title="Khóa tài khoản">
                                                    <IconBan size={18} />
                                                </button>
                                            ) : (
                                                <button className="p-2 hover:bg-green-500/20 rounded-lg text-white/70 hover:text-green-400 transition-colors" title="Mở khóa">
                                                    <IconCheck size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
