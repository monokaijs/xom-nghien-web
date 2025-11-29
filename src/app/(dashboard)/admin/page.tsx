import React from 'react';
import { IconUsers, IconServer, IconActivity, IconTrophy } from '@tabler/icons-react';
import { db } from '@/lib/database';
import { userInfo, servers, matchzyStatsMatches } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';
import { getServersWithStatus } from '@/lib/utils/servers';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function getAdminStats() {
    const [totalUsersResult, totalServersResult, todayMatchesResult, recentUsersResult] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM ${userInfo}`),
        db.execute(sql`SELECT COUNT(*) as count FROM ${servers}`),
        db.execute(sql`
            SELECT COUNT(*) as count
            FROM ${matchzyStatsMatches}
            WHERE DATE(start_time) = CURDATE()
        `),
        db.select({
            steamid64: userInfo.steamid64,
            name: userInfo.name,
            avatar: userInfo.avatar,
            last_updated: userInfo.last_updated,
        })
        .from(userInfo)
        .orderBy(desc(userInfo.last_updated))
        .limit(5),
    ]);

    const totalUsers = (totalUsersResult[0] as any)[0]?.count || 0;
    const totalServers = (totalServersResult[0] as any)[0]?.count || 0;
    const todayMatches = (todayMatchesResult[0] as any)[0]?.count || 0;

    return {
        totalUsers,
        totalServers,
        todayMatches,
        recentUsers: recentUsersResult,
    };
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}

export default async function AdminDashboardPage() {
    const [stats, serversWithStatus] = await Promise.all([
        getAdminStats(),
        getServersWithStatus(),
    ]);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold mb-2">Tổng Quan Hệ Thống</h2>
                <p className="text-white/50">Theo dõi hoạt động và trạng thái của hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Người Dùng"
                    value={stats.totalUsers.toLocaleString()}
                    icon={<IconUsers size={24} />}
                />
                <StatCard
                    title="Tổng Server"
                    value={stats.totalServers.toString()}
                    icon={<IconServer size={24} />}
                    color="bg-blue-500/20 text-blue-500"
                />
                <StatCard
                    title="Trận Đấu Hôm Nay"
                    value={stats.todayMatches.toString()}
                    icon={<IconActivity size={24} />}
                    color="bg-purple-500/20 text-purple-500"
                />
                <StatCard
                    title="Server Online"
                    value={serversWithStatus.filter(s => s.online).length.toString()}
                    icon={<IconTrophy size={24} />}
                    color="bg-green-500/20 text-green-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold mb-4">Hoạt Động Gần Đây</h3>
                    <div className="space-y-4">
                        {stats.recentUsers.length === 0 ? (
                            <div className="text-white/40 text-center py-8">Chưa có hoạt động</div>
                        ) : (
                            stats.recentUsers.map((user) => (
                                <div key={user.steamid64} className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <Image
                                        src={user.avatar || '/default-avatar.png'}
                                        alt={user.name}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-white/40">
                                            Cập nhật {formatTimeAgo(new Date(user.last_updated))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold mb-4">Trạng Thái Server</h3>
                    <div className="space-y-4">
                        {serversWithStatus.length === 0 ? (
                            <div className="text-white/40 text-center py-8">Chưa có server</div>
                        ) : (
                            serversWithStatus.map((server) => (
                                <div key={server.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${server.online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                                        <span className="font-medium">{server.name}</span>
                                    </div>
                                    <span className="text-sm text-white/50">
                                        {server.online ? `${server.players.current}/${server.players.max} Players` : 'Offline'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
