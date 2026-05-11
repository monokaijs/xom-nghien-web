"use client";

import React, { useState, useEffect } from 'react';
import { IconSearch, IconTrash, IconEye, IconAlertTriangle } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Match {
  matchid: number;
  start_time: string;
  end_time: string | null;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  series_type: string;
  winner: string;
  maps_played: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ManageMatchesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchMatches();
  }, [search]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');

      const response = await fetch(`/api/matches?${params}`);
      if (response.ok) {
        const data = await response.json();
        let matchList = data.matches || [];
        
        if (search) {
          matchList = matchList.filter((m: Match) => 
            m.team1_name.toLowerCase().includes(search.toLowerCase()) ||
            m.team2_name.toLowerCase().includes(search.toLowerCase()) ||
            m.matchid.toString().includes(search)
          );
        }
        
        setMatches(matchList);
        setTotal(matchList.length);
      } else {
        console.error('Failed to fetch matches');
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matchid: number) => {
    if (!isAdmin) {
      alert('Chỉ admin mới có quyền xóa trận đấu');
      return;
    }

    setDeleteLoading(matchid);
    try {
      const response = await fetch(`/api/admin/matches/${matchid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMatches();
        setConfirmDelete(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Quản Lý Trận Đấu</h2>
          <p className="text-white/50 text-sm">Xem và quản lý các trận đấu. Tổng: {total} trận</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3"/>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đội, ID trận..."
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
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Không tìm thấy trận đấu</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Đội</th>
                <th className="px-6 py-4">Tỷ Số</th>
                <th className="px-6 py-4">Thời Gian</th>
                <th className="px-6 py-4">Người Thắng</th>
                <th className="px-6 py-4 text-right">Hành Động</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
              {matches.map((match) => {
                const isTeam1Winner = match.winner === match.team1_name || (match.team1_score > match.team2_score);
                const isTeam2Winner = match.winner === match.team2_name || (match.team2_score > match.team1_score);
                const winnerName = isTeam1Winner ? match.team1_name : isTeam2Winner ? match.team2_name : 'Draw';

                return (
                  <tr key={match.matchid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm text-white/70">#{match.matchid}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{match.team1_name}</span>
                        <span className="text-white/50 text-sm">vs</span>
                        <span className="font-medium">{match.team2_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={isTeam1Winner ? 'text-green-400 font-bold' : 'text-white/70'}>{match.team1_score}</span>
                        <span className="text-white/50 text-sm">-</span>
                        <span className={isTeam2Winner ? 'text-green-400 font-bold' : 'text-white/70'}>{match.team2_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/70 text-sm">{formatDate(match.start_time)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400">
                        {winnerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/matches/${match.matchid}`)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                          title="Xem chi tiết">
                          <IconEye size={18}/>
                        </button>
                        {isAdmin && (
                          confirmDelete === match.matchid ? (
                            <button
                              onClick={() => handleDelete(match.matchid)}
                              disabled={deleteLoading === match.matchid}
                              className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Xác nhận xóa">
                              <IconAlertTriangle size={18}/>
                              <span className="text-xs">Xác nhận?</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(match.matchid)}
                              disabled={deleteLoading === match.matchid}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Xóa trận đấu">
                              <IconTrash size={18}/>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

