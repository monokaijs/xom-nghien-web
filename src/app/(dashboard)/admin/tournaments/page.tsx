"use client";

import React, { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconTrophy, IconX, IconCopy } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Select from '@/components/ui/Select';

interface Tournament {
  id: number;
  team1_name: string;
  team2_name: string;
  num_maps: number;
  maplist: string[];
  clinch_series: number;
  players_per_team: number;
  cvars: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface Player {
  steamid64: string;
  name: string;
}

interface User {
  steamid64: string;
  name: string;
  avatar: string;
}

const BO_OPTIONS = [
  { value: '1', label: 'BO1' },
  { value: '3', label: 'BO3' },
  { value: '5', label: 'BO5' },
];

const CS2_MAPS = [
  'de_dust2',
  'de_inferno',
  'de_mirage',
  'de_nuke',
  'de_overpass',
  'de_vertigo',
  'de_ancient',
  'de_anubis',
];

let searchDebounceTimer: NodeJS.Timeout;

export default function TournamentsPage() {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    team1_name: '',
    team2_name: '',
    num_maps: 3,
    clinch_series: true,
    players_per_team: 5,
  });

  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [cvars, setCvars] = useState<Array<{ key: string; value: string }>>([]);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);

  const [team1Search, setTeam1Search] = useState('');
  const [team2Search, setTeam2Search] = useState('');
  const [team1SearchResults, setTeam1SearchResults] = useState<User[]>([]);
  const [team2SearchResults, setTeam2SearchResults] = useState<User[]>([]);
  const [team1SearchLoading, setTeam1SearchLoading] = useState(false);
  const [team2SearchLoading, setTeam2SearchLoading] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchTournaments();
  }, [search]);

  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (team1Search.length >= 2) {
      setTeam1SearchLoading(true);
      searchDebounceTimer = setTimeout(() => {
        searchUsers(team1Search, 1);
      }, 500);
    } else {
      setTeam1SearchResults([]);
      setTeam1SearchLoading(false);
    }

    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [team1Search]);

  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (team2Search.length >= 2) {
      setTeam2SearchLoading(true);
      searchDebounceTimer = setTimeout(() => {
        searchUsers(team2Search, 2);
      }, 500);
    } else {
      setTeam2SearchResults([]);
      setTeam2SearchLoading(false);
    }

    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [team2Search]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/tournaments?${params}`);
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string, team: 1 | 2) => {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      params.append('limit', '10');

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (team === 1) {
        setTeam1SearchResults(data.users || []);
        setTeam1SearchLoading(false);
      } else {
        setTeam2SearchResults(data.users || []);
        setTeam2SearchLoading(false);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      if (team === 1) {
        setTeam1SearchLoading(false);
      } else {
        setTeam2SearchLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingTournament(null);
    setFormData({
      team1_name: '',
      team2_name: '',
      num_maps: 3,
      clinch_series: true,
      players_per_team: 5,
    });
    setSelectedMaps([]);
    setCvars([]);
    setTeam1Players([]);
    setTeam2Players([]);
    setTeam1Search('');
    setTeam2Search('');
    setTeam1SearchResults([]);
    setTeam2SearchResults([]);
    setShowModal(true);
  };

  const openEditModal = async (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      team1_name: tournament.team1_name,
      team2_name: tournament.team2_name,
      num_maps: tournament.num_maps,
      clinch_series: tournament.clinch_series === 1,
      players_per_team: tournament.players_per_team,
    });
    setSelectedMaps(tournament.maplist);
    setCvars(Object.entries(tournament.cvars || {}).map(([key, value]) => ({ key, value })));

    try {
      const response = await fetch(`/api/admin/tournaments/${tournament.id}`);
      const data = await response.json();
      const players = data.players || [];
      setTeam1Players(players.filter((p: any) => p.team_number === 1).map((p: any) => ({ steamid64: p.steamid64, name: p.player_name })));
      setTeam2Players(players.filter((p: any) => p.team_number === 2).map((p: any) => ({ steamid64: p.steamid64, name: p.player_name })));
    } catch (error) {
      console.error('Error fetching tournament players:', error);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingTournament?.id || -1);

    if (selectedMaps.length !== formData.num_maps) {
      alert(`Please select exactly ${formData.num_maps} maps`);
      setActionLoading(null);
      return;
    }

    const duplicatePlayers = team1Players.filter(p1 => team2Players.some(p2 => p2.steamid64 === p1.steamid64));
    if (duplicatePlayers.length > 0) {
      alert(`Player ${duplicatePlayers[0].name} cannot be in both teams`);
      setActionLoading(null);
      return;
    }

    try {
      const url = editingTournament
        ? `/api/admin/tournaments/${editingTournament.id}`
        : '/api/admin/tournaments';

      const cvarsObj = cvars.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(url, {
        method: editingTournament ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maplist: selectedMaps,
          cvars: cvarsObj,
          team1_players: team1Players,
          team2_players: team2Players,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        fetchTournaments();
      } else {
        const data = await response.json();
        alert(data.error || 'Error occurred');
      }
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert('Error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/tournaments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTournaments();
      } else {
        alert('Failed to delete tournament');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const addPlayer = (user: User, team: 1 | 2) => {
    const player = { steamid64: user.steamid64, name: user.name };
    const targetTeam = team === 1 ? team1Players : team2Players;
    const otherTeam = team === 1 ? team2Players : team1Players;

    if (targetTeam.some(p => p.steamid64 === user.steamid64)) {
      alert('Player already in this team');
      return;
    }

    if (otherTeam.some(p => p.steamid64 === user.steamid64)) {
      alert('Player already in the other team');
      return;
    }

    if (team === 1) {
      setTeam1Players([...team1Players, player]);
      setTeam1Search('');
      setTeam1SearchResults([]);
    } else {
      setTeam2Players([...team2Players, player]);
      setTeam2Search('');
      setTeam2SearchResults([]);
    }
  };

  const removePlayer = (steamid64: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1Players(team1Players.filter(p => p.steamid64 !== steamid64));
    } else {
      setTeam2Players(team2Players.filter(p => p.steamid64 !== steamid64));
    }
  };

  const toggleMap = (map: string) => {
    if (selectedMaps.includes(map)) {
      setSelectedMaps(selectedMaps.filter(m => m !== map));
    } else {
      if (selectedMaps.length < formData.num_maps) {
        setSelectedMaps([...selectedMaps, map]);
      }
    }
  };

  const addCvar = () => {
    setCvars([...cvars, { key: '', value: '' }]);
  };

  const removeCvar = (index: number) => {
    setCvars(cvars.filter((_, i) => i !== index));
  };

  const updateCvar = (index: number, field: 'key' | 'value', value: string) => {
    const newCvars = [...cvars];
    newCvars[index][field] = value;
    setCvars(newCvars);
  };

  const copyMatchzyUrl = (id: number) => {
    const url = `${window.location.origin}/api/tournaments/${id}/matchzy`;
    navigator.clipboard.writeText(url);
    alert('MatchZy URL copied to clipboard!');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/50">Không có quyền truy cập</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Giải Đấu CS2</h2>
          <p className="text-white/60 text-sm">Quản lý giải đấu CS2 cho MatchZy</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <IconPlus size={20} />
          Tạo Giải Đấu
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-accent-primary/50 transition-colors">
          <IconSearch size={20} className="text-white/40 mr-3" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đội..."
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
        ) : tournaments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Không tìm thấy giải đấu</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-xs uppercase text-white/50 font-bold tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Đội</th>
                  <th className="px-6 py-4">Định Dạng</th>
                  <th className="px-6 py-4">Bản Đồ</th>
                  <th className="px-6 py-4">Ngày Tạo</th>
                  <th className="px-6 py-4">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/80">#{tournament.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{tournament.team1_name} vs {tournament.team2_name}</div>
                    </td>
                    <td className="px-6 py-4 text-white/80">BO{tournament.num_maps}</td>
                    <td className="px-6 py-4 text-white/60 text-sm">{tournament.maplist.join(', ')}</td>
                    <td className="px-6 py-4 text-white/60 text-sm">
                      {new Date(tournament.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyMatchzyUrl(tournament.id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Sao chép URL MatchZy"
                        >
                          <IconCopy size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(tournament)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                          disabled={actionLoading === tournament.id}
                        >
                          <IconEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(tournament.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          disabled={actionLoading === tournament.id}
                        >
                          <IconTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card-bg rounded-2xl border border-white/10 w-full max-w-6xl my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <IconTrophy size={24} />
                {editingTournament ? 'Chỉnh Sửa Giải Đấu' : 'Tạo Giải Đấu'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">
                <IconX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Tên Đội 1</label>
                  <input
                    type="text"
                    value={formData.team1_name}
                    onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Tên Đội 2</label>
                  <input
                    type="text"
                    value={formData.team2_name}
                    onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">B.O</label>
                  <Select
                    options={BO_OPTIONS}
                    value={formData.num_maps.toString()}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      setFormData({ ...formData, num_maps: num });
                      setSelectedMaps(selectedMaps.slice(0, num));
                    }}
                    className={'w-full'}
                    size="md"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Số Người Mỗi Đội</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.players_per_team}
                    onChange={(e) => setFormData({ ...formData, players_per_team: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Clinch Series</label>
                  <Select
                    className={'w-full'}
                    options={[
                      { value: 'true', label: 'Bật' },
                      { value: 'false', label: 'Tắt' },
                    ]}
                    value={formData.clinch_series.toString()}
                    onChange={(e) => setFormData({ ...formData, clinch_series: e.target.value === 'true' })}
                    size="md"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-white/80 text-sm mb-2 block">
                  Bản đồ (Vui lòng chọn {formData.num_maps})
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {CS2_MAPS.map((map) => (
                    <button
                      key={map}
                      type="button"
                      onClick={() => toggleMap(map)}
                      className={`relative h-20 rounded-lg text-sm font-medium transition-all overflow-hidden group ${
                        selectedMaps.includes(map)
                          ? 'ring-2 ring-accent-primary'
                          : 'ring-1 ring-white/10 hover:ring-white/30'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                        style={{
                          backgroundImage: `url(/maps/${map}.png)`,
                        }}
                      />
                      <div className={`absolute inset-0 transition-colors ${
                        selectedMaps.includes(map)
                          ? 'bg-accent-primary/60'
                          : 'bg-black/60 group-hover:bg-black/40'
                      }`} />
                      <div className="relative z-10 h-full flex items-center justify-center">
                        <span className="text-white drop-shadow-lg">{map.replace('de_', '')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Người Chơi Đội 1</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={team1Search}
                      onChange={(e) => setTeam1Search(e.target.value)}
                      placeholder="Tìm kiếm người chơi..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white mb-3 text-sm"
                    />

                    {team1SearchLoading && (
                      <div className="text-white/50 text-sm mb-3">Đang tìm...</div>
                    )}

                    {team1SearchResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                        {team1SearchResults.map((user) => (
                          <button
                            key={user.steamid64}
                            type="button"
                            onClick={() => addPlayer(user, 1)}
                            className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                          >
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                            <div className="text-left flex-1 min-w-0">
                              <div className="text-white text-sm truncate">{user.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="text-white/40 text-xs mb-2">Danh sách ({team1Players.length})</div>
                      {team1Players.map((player) => (
                        <div key={player.steamid64} className="flex justify-between items-center mb-2 bg-white/5 px-3 py-2 rounded-lg">
                          <span className="text-white text-sm">{player.name}</span>
                          <button
                            type="button"
                            onClick={() => removePlayer(player.steamid64, 1)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <IconX size={16} />
                          </button>
                        </div>
                      ))}
                      {team1Players.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">Chưa có người chơi</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Người Chơi Đội 2</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={team2Search}
                      onChange={(e) => setTeam2Search(e.target.value)}
                      placeholder="Tìm kiếm người chơi..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white mb-3 text-sm"
                    />

                    {team2SearchLoading && (
                      <div className="text-white/50 text-sm mb-3">Đang tìm...</div>
                    )}

                    {team2SearchResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                        {team2SearchResults.map((user) => (
                          <button
                            key={user.steamid64}
                            type="button"
                            onClick={() => addPlayer(user, 2)}
                            className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                          >
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                            <div className="text-left flex-1 min-w-0">
                              <div className="text-white text-sm truncate">{user.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="text-white/40 text-xs mb-2">Danh sách ({team2Players.length})</div>
                      {team2Players.map((player) => (
                        <div key={player.steamid64} className="flex justify-between items-center mb-2 bg-white/5 px-3 py-2 rounded-lg">
                          <span className="text-white text-sm">{player.name}</span>
                          <button
                            type="button"
                            onClick={() => removePlayer(player.steamid64, 2)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <IconX size={16} />
                          </button>
                        </div>
                      ))}
                      {team2Players.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">Chưa có người chơi</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-white/80 text-sm">CVars (Tùy chọn)</label>
                  <button
                    type="button"
                    onClick={addCvar}
                    className="text-accent-primary hover:text-accent-primary/80 text-sm"
                  >
                    + Thêm CVar
                  </button>
                </div>
                <div className="space-y-2">
                  {cvars.map((cvar, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={cvar.key}
                        onChange={(e) => updateCvar(index, 'key', e.target.value)}
                        placeholder="Key (vd: hostname)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                      />
                      <input
                        type="text"
                        value={cvar.value}
                        onChange={(e) => updateCvar(index, 'value', e.target.value)}
                        placeholder="Giá trị"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCvar(index)}
                        className="text-red-400 hover:text-red-300 px-3"
                      >
                        <IconX size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-6 py-2 rounded-xl transition-colors"
                >
                  {actionLoading !== null ? 'Đang lưu...' : editingTournament ? 'Cập Nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

