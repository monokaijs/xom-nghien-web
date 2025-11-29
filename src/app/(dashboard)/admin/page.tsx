import React from 'react';
import { IconUsers, IconServer, IconActivity, IconAlertTriangle } from '@tabler/icons-react';

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: string, color?: string }) {
    return (
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color || 'bg-accent-primary/20 text-accent-primary'}`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded-lg">
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-white/50 text-sm">{title}</div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold mb-2">Tổng Quan Hệ Thống</h2>
                <p className="text-white/50">Theo dõi hoạt động và trạng thái của hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Người Dùng"
                    value="1,234"
                    icon={<IconUsers size={24} />}
                    trend="+12%"
                />
                <StatCard
                    title="Server Đang Chạy"
                    value="8"
                    icon={<IconServer size={24} />}
                    color="bg-blue-500/20 text-blue-500"
                />
                <StatCard
                    title="Trận Đấu Hôm Nay"
                    value="42"
                    icon={<IconActivity size={24} />}
                    trend="+5%"
                    color="bg-purple-500/20 text-purple-500"
                />
                <StatCard
                    title="Cảnh Báo Hệ Thống"
                    value="3"
                    icon={<IconAlertTriangle size={24} />}
                    color="bg-yellow-500/20 text-yellow-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold mb-4">Hoạt Động Gần Đây</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                    U{i}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">Người dùng User_{i} vừa đăng nhập</div>
                                    <div className="text-xs text-white/40">2 phút trước</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold mb-4">Trạng Thái Server</h3>
                    <div className="space-y-4">
                        {['Public #1', 'Public #2', 'Match #1', 'Match #2'].map((server, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    <span className="font-medium">{server}</span>
                                </div>
                                <span className="text-sm text-white/50">12/24 Players</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
