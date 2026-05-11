"use client";

import React, { useEffect, useState } from 'react';
import { IconAdjustments, IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import { CS2_MAP_LABELS, CS2_MAPS, CS2_MODE_LABELS, CS2_MODES } from '@xom/game-config';

interface GameConfiguration {
  id: number;
  gameKey: string;
  name: string;
  description: string | null;
  isActive: number;
  currentVersion: {
    id: number;
    versionNumber: number;
    config: Record<string, any>;
  } | null;
}

const emptyConfig = {
  name: '',
  description: '',
  mode: 'competitive',
  map: 'de_dust2',
  maxPlayers: 10,
  tickRate: 128,
  serverPassword: '',
  admins: '',
  isActive: true,
};

export default function GameConfigurationsPage() {
  const [configs, setConfigs] = useState<GameConfiguration[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GameConfiguration | null>(null);
  const [form, setForm] = useState(emptyConfig);

  const fetchConfigs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const response = await fetch(`/api/admin/game-configurations?${params}`);
    const data = await response.json();
    setConfigs(data.configurations || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyConfig);
    setShowModal(true);
  };

  const openEdit = (config: GameConfiguration) => {
    const snapshot = config.currentVersion?.config || {};
    setEditing(config);
    setForm({
      name: config.name,
      description: config.description || '',
      mode: snapshot.mode || 'competitive',
      map: snapshot.map || 'de_dust2',
      maxPlayers: Number(snapshot.maxPlayers || 10),
      tickRate: Number(snapshot.tickRate || 128),
      serverPassword: snapshot.serverPassword || '',
      admins: Array.isArray(snapshot.admins) ? snapshot.admins.join('\n') : '',
      isActive: config.isActive === 1,
    });
    setShowModal(true);
  };

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      gameKey: 'cs2',
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      config: {
        mode: form.mode,
        map: form.map,
        maxPlayers: form.maxPlayers,
        tickRate: form.tickRate,
        serverPassword: form.serverPassword || undefined,
        admins: form.admins.split('\n').map((item) => item.trim()).filter(Boolean),
      },
    };
    const response = await fetch(editing ? `/api/admin/game-configurations/${editing.id}` : '/api/admin/game-configurations', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to save configuration');
      return;
    }
    setShowModal(false);
    await fetchConfigs();
  };

  const archiveConfig = async (config: GameConfiguration) => {
    if (!confirm(`Archive ${config.name}?`)) return;
    await fetch(`/api/admin/game-configurations/${config.id}`, { method: 'DELETE' });
    await fetchConfigs();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Game Configurations</h2>
          <p className="text-white/50 text-sm">Saved CS2 setup templates. Editing creates a new immutable version.</p>
        </div>
        <button onClick={openCreate} className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <IconPlus size={18} /> Add Config
        </button>
      </div>

      <div className="bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 mb-6">
        <IconSearch size={18} className="text-white/40 mr-3" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search configurations..." className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <div className="text-white/50">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/5 p-10 text-center text-white/50">No configurations yet</div>
        ) : configs.map((config) => {
          const snapshot = config.currentVersion?.config || {};
          return (
            <div key={config.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/20 text-accent-primary flex items-center justify-center">
                    <IconAdjustments size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{config.name}</h3>
                    <p className="text-xs text-white/50">v{config.currentVersion?.versionNumber || 0} · {config.gameKey.toUpperCase()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${config.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {config.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <Info label="Mode" value={CS2_MODE_LABELS[snapshot.mode as keyof typeof CS2_MODE_LABELS] || snapshot.mode || '-'} />
                <Info label="Map" value={CS2_MAP_LABELS[snapshot.map as keyof typeof CS2_MAP_LABELS] || snapshot.map || '-'} />
                <Info label="Max Players" value={String(snapshot.maxPlayers || '-')} />
                <Info label="Tick Rate" value={String(snapshot.tickRate || '-')} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(config)} className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 flex items-center gap-2 text-sm"><IconEdit size={16} /> Edit</button>
                <button onClick={() => archiveConfig(config)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 flex items-center gap-2 text-sm"><IconTrash size={16} /> Archive</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Edit Configuration' : 'Add Configuration'}</h3>
            <form onSubmit={saveConfig} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <Input label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required={false} />
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block mb-2">Mode</span>
                  <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} options={CS2_MODES.map((mode) => ({ value: mode, label: CS2_MODE_LABELS[mode] }))} className="w-full" />
                </label>
                <label className="block text-sm">
                  <span className="block mb-2">Map</span>
                  <Select value={form.map} onChange={(e) => setForm({ ...form, map: e.target.value })} options={CS2_MAPS.map((map) => ({ value: map, label: CS2_MAP_LABELS[map] }))} className="w-full" />
                </label>
                <Input label="Max Players" type="number" value={form.maxPlayers} onChange={(value) => setForm({ ...form, maxPlayers: Number(value) })} />
                <label className="block text-sm">
                  <span className="block mb-2">Tick Rate</span>
                  <Select value={String(form.tickRate)} onChange={(e) => setForm({ ...form, tickRate: Number(e.target.value) })} options={[{ value: '128', label: '128' }, { value: '64', label: '64' }]} className="w-full" />
                </label>
              </div>
              <Input label="Server Password" value={form.serverPassword} onChange={(value) => setForm({ ...form, serverPassword: value })} required={false} />
              <label className="block text-sm">
                <span className="block mb-2">Admin Steam IDs</span>
                <textarea value={form.admins} onChange={(e) => setForm({ ...form, admins: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white min-h-[90px]" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-accent-primary text-white rounded-lg px-4 py-2">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/10 rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = true }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="block mb-2">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
    </label>
  );
}
