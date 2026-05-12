"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  IconAdjustments,
  IconEdit,
  IconFileText,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTerminal2,
  IconTrash,
  IconVariable,
} from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import {
  CS2_MAP_LABELS,
  CS2_MODE_LABELS,
  CS2_MODE_PRESETS,
  CS2_RESERVED_ENV_KEYS,
  type Cs2EnvValue,
  type Cs2ServerConfig,
  validateCs2Config,
} from '@xom/game-config';

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

type TabKey = 'basic' | 'startup' | 'files' | 'env';
type EnvValueType = 'string' | 'number' | 'boolean';

interface EnvEntry {
  id: string;
  key: string;
  value: string;
  type: EnvValueType;
}

interface FileEntry {
  id: string;
  path: string;
  content: string;
}

interface ConfigForm {
  name: string;
  description: string;
  mode: string;
  modeLabel: string;
  modeExec: string;
  map: string;
  maxPlayers: number;
  tickRate: number;
  serverPassword: string;
  admins: string;
  startupCommands: string;
  envVars: EnvEntry[];
  customFiles: FileEntry[];
  isActive: boolean;
}

const CUSTOM_MODE_VALUE = '__custom__';
const RESERVED_ENV_KEYS = new Set<string>(CS2_RESERVED_ENV_KEYS);
const firstPreset = CS2_MODE_PRESETS[0];

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const makeEmptyConfig = (): ConfigForm => ({
  name: '',
  description: '',
  mode: firstPreset.mode,
  modeLabel: firstPreset.label,
  modeExec: firstPreset.exec,
  map: 'de_dust2',
  maxPlayers: 10,
  tickRate: 128,
  serverPassword: '',
  admins: '',
  startupCommands: '',
  envVars: [],
  customFiles: [],
  isActive: true,
});

export default function GameConfigurationsPage() {
  const [configs, setConfigs] = useState<GameConfiguration[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GameConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState<ConfigForm>(() => makeEmptyConfig());

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

  const selectedMode = useMemo(() => {
    const preset = CS2_MODE_PRESETS.find((item) => item.mode === form.mode && item.exec === form.modeExec);
    return preset?.mode || CUSTOM_MODE_VALUE;
  }, [form.mode, form.modeExec]);

  const generatedStartupPreview = useMemo(() => [
    `exec_after_delay 30 "changelevel ${form.map || '<map>'}"`,
    `exec_after_delay 50 "exec ${form.modeExec || '<mode cfg>'}"`,
  ], [form.map, form.modeExec]);

  const openCreate = () => {
    setEditing(null);
    setForm(makeEmptyConfig());
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (config: GameConfiguration) => {
    const snapshot = normalizeSnapshot(config.currentVersion?.config || makeEmptyConfig());
    setEditing(config);
    setForm({
      name: config.name,
      description: config.description || '',
      mode: snapshot.mode,
      modeLabel: snapshot.modeLabel,
      modeExec: snapshot.modeExec,
      map: snapshot.map,
      maxPlayers: snapshot.maxPlayers,
      tickRate: snapshot.tickRate,
      serverPassword: snapshot.serverPassword || '',
      admins: snapshot.admins.join('\n'),
      startupCommands: snapshot.startupCommands.join('\n'),
      envVars: Object.entries(snapshot.env).map(([key, value]) => ({
        id: makeId(),
        key,
        value: String(value),
        type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
      })),
      customFiles: snapshot.customFiles.map((file) => ({
        id: makeId(),
        path: file.path,
        content: file.content,
      })),
      isActive: config.isActive === 1,
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault();

    let normalizedConfig: Cs2ServerConfig;
    try {
      normalizedConfig = validateCs2Config(buildConfigPayload(form));
    } catch (error: any) {
      alert(error.message || 'Invalid configuration');
      return;
    }

    const payload = {
      gameKey: 'cs2',
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      config: normalizedConfig,
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

  const updateEnvEntry = (id: string, patch: Partial<EnvEntry>) => {
    setForm({
      ...form,
      envVars: form.envVars.map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
    });
  };

  const updateFileEntry = (id: string, patch: Partial<FileEntry>) => {
    setForm({
      ...form,
      customFiles: form.customFiles.map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Game Configurations</h2>
          <p className="text-white/50 text-sm">Versioned CS2 bundles rendered by the system during deployment.</p>
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
          const snapshot = normalizeSnapshot(config.currentVersion?.config || makeEmptyConfig());
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
                <Info label="Mode" value={snapshot.modeLabel || CS2_MODE_LABELS[snapshot.mode] || snapshot.mode || '-'} />
                <Info label="Map" value={CS2_MAP_LABELS[snapshot.map] || snapshot.map || '-'} />
                <Info label="Mode Exec" value={snapshot.modeExec || '-'} />
                <Info label="Files" value={String(snapshot.customFiles.length)} />
                <Info label="Max Players" value={String(snapshot.maxPlayers || '-')} />
                <Info label="Env Vars" value={String(Object.keys(snapshot.env).length)} />
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
          <div className="bg-bg-panel rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Edit Configuration' : 'Add Configuration'}</h3>
            <form onSubmit={saveConfig} className="space-y-4">
              <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
                <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} icon={<IconSettings size={16} />} label="Basic" />
                <TabButton active={activeTab === 'startup'} onClick={() => setActiveTab('startup')} icon={<IconTerminal2 size={16} />} label="Startup" />
                <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<IconFileText size={16} />} label="Files" />
                <TabButton active={activeTab === 'env'} onClick={() => setActiveTab('env')} icon={<IconVariable size={16} />} label="Env" />
              </div>

              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                  <Input label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required={false} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="block mb-2">Mode</span>
                      <Select
                        value={selectedMode}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === CUSTOM_MODE_VALUE) {
                            setForm({
                              ...form,
                              mode: CS2_MODE_LABELS[form.mode] ? 'custom' : form.mode,
                              modeLabel: CS2_MODE_LABELS[form.mode] || form.modeLabel || 'Custom',
                              modeExec: CS2_MODE_LABELS[form.mode] ? 'custom/my_mode.cfg' : form.modeExec,
                            });
                            return;
                          }
                          const preset = CS2_MODE_PRESETS.find((item) => item.mode === value) || firstPreset;
                          setForm({
                            ...form,
                            mode: preset.mode,
                            modeLabel: preset.label,
                            modeExec: preset.exec,
                          });
                        }}
                        options={[
                          ...CS2_MODE_PRESETS.map((preset) => ({ value: preset.mode, label: preset.label })),
                          { value: CUSTOM_MODE_VALUE, label: 'Custom mode' },
                        ]}
                        className="w-full"
                      />
                    </label>
                    <Input label="Map" value={form.map} onChange={(value) => setForm({ ...form, map: value })} />
                    {selectedMode === CUSTOM_MODE_VALUE && (
                      <>
                        <Input label="Custom Mode ID" value={form.mode} onChange={(value) => setForm({ ...form, mode: value })} />
                        <Input label="Mode Label" value={form.modeLabel} onChange={(value) => setForm({ ...form, modeLabel: value })} />
                      </>
                    )}
                    <Input label="Mode Exec CFG" value={form.modeExec} onChange={(value) => setForm({ ...form, modeExec: value })} />
                    <Input label="Max Players" type="number" value={form.maxPlayers} onChange={(value) => setForm({ ...form, maxPlayers: Number(value) })} />
                    <label className="block text-sm">
                      <span className="block mb-2">Tick Rate</span>
                      <Select value={String(form.tickRate)} onChange={(e) => setForm({ ...form, tickRate: Number(e.target.value) })} options={[{ value: '128', label: '128' }, { value: '64', label: '64' }]} className="w-full" />
                    </label>
                    <Input label="Server Password" value={form.serverPassword} onChange={(value) => setForm({ ...form, serverPassword: value })} required={false} />
                  </div>
                  <label className="block text-sm">
                    <span className="block mb-2">Admin Steam IDs</span>
                    <textarea value={form.admins} onChange={(e) => setForm({ ...form, admins: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white min-h-[90px]" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
              )}

              {activeTab === 'startup' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-sm text-white/50 mb-2">Generated boot commands</div>
                    <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">{generatedStartupPreview.join('\n')}</pre>
                  </div>
                  <label className="block text-sm">
                    <span className="block mb-2">Extra Startup Commands</span>
                    <textarea
                      value={form.startupCommands}
                      onChange={(e) => setForm({ ...form, startupCommands: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white min-h-[180px] font-mono text-sm"
                      placeholder={'say "Server ready"'}
                    />
                  </label>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-white/50">Paths are relative to the generated custom_files root.</div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, customFiles: [...form.customFiles, { id: makeId(), path: 'cfg/custom_all.cfg', content: '' }] })}
                      className="bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <IconPlus size={16} /> Add File
                    </button>
                  </div>
                  {form.customFiles.length === 0 ? (
                    <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-white/50 text-sm">No custom files. Managed boot and admin files will still be generated.</div>
                  ) : form.customFiles.map((file) => (
                    <div key={file.id} className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-3">
                      <div className="flex gap-3">
                        <Input label="Path" value={file.path} onChange={(value) => updateFileEntry(file.id, { path: value })} />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, customFiles: form.customFiles.filter((entry) => entry.id !== file.id) })}
                          className="self-end p-2 rounded-lg bg-red-500/20 text-red-400"
                          title="Remove file"
                        >
                          <IconTrash size={18} />
                        </button>
                      </div>
                      <label className="block text-sm">
                        <span className="block mb-2">Content</span>
                        <textarea
                          value={file.content}
                          onChange={(e) => updateFileEntry(file.id, { content: e.target.value })}
                          className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-2 text-white min-h-[180px] font-mono text-sm"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'env' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-white/50">
                      Reserved keys: {CS2_RESERVED_ENV_KEYS.join(', ')}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, envVars: [...form.envVars, { id: makeId(), key: '', value: '', type: 'string' }] })}
                      className="bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <IconPlus size={16} /> Add Env
                    </button>
                  </div>
                  {form.envVars.length === 0 ? (
                    <div className="bg-white/5 rounded-lg border border-white/10 p-6 text-white/50 text-sm">No additional env vars.</div>
                  ) : form.envVars.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_1fr_auto] gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                      <Input label="Key" value={entry.key} onChange={(value) => updateEnvEntry(entry.id, { key: value.toUpperCase() })} />
                      <label className="block text-sm">
                        <span className="block mb-2">Type</span>
                        <Select
                          value={entry.type}
                          onChange={(e) => updateEnvEntry(entry.id, { type: e.target.value as EnvValueType, value: e.target.value === 'boolean' ? 'true' : entry.value })}
                          options={[{ value: 'string', label: 'String' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' }]}
                          className="w-full"
                        />
                      </label>
                      {entry.type === 'boolean' ? (
                        <label className="block text-sm">
                          <span className="block mb-2">Value</span>
                          <Select value={entry.value === 'false' ? 'false' : 'true'} onChange={(e) => updateEnvEntry(entry.id, { value: e.target.value })} options={[{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }]} className="w-full" />
                        </label>
                      ) : (
                        <Input label="Value" type={entry.type === 'number' ? 'number' : 'text'} value={entry.value} onChange={(value) => updateEnvEntry(entry.id, { value })} />
                      )}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, envVars: form.envVars.filter((item) => item.id !== entry.id) })}
                        className="self-end p-2 rounded-lg bg-red-500/20 text-red-400"
                        title="Remove env var"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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

function normalizeSnapshot(config: Record<string, any>): Cs2ServerConfig {
  try {
    return validateCs2Config(config);
  } catch {
    return validateCs2Config({
      mode: config.mode || firstPreset.mode,
      modeLabel: config.modeLabel || CS2_MODE_LABELS[config.mode] || firstPreset.label,
      modeExec: config.modeExec || firstPreset.exec,
      map: config.map || 'de_dust2',
      maxPlayers: config.maxPlayers || 10,
      tickRate: config.tickRate || 128,
      serverPassword: config.serverPassword,
      admins: Array.isArray(config.admins) ? config.admins : [],
      startupCommands: Array.isArray(config.startupCommands) ? config.startupCommands : [],
      env: config.env && typeof config.env === 'object' ? config.env : {},
      customFiles: [],
    });
  }
}

function buildConfigPayload(form: ConfigForm) {
  const env: Record<string, Cs2EnvValue> = {};
  for (const entry of form.envVars) {
    const key = entry.key.trim().toUpperCase();
    if (!key && !entry.value) continue;
    if (RESERVED_ENV_KEYS.has(key)) {
      throw new Error(`${key} is managed by the system and cannot be overridden`);
    }
    env[key] = parseEnvValue(entry);
  }

  return {
    mode: form.mode,
    modeLabel: form.modeLabel,
    modeExec: form.modeExec,
    map: form.map,
    maxPlayers: form.maxPlayers,
    tickRate: form.tickRate,
    serverPassword: form.serverPassword || undefined,
    admins: form.admins.split('\n').map((item) => item.trim()).filter(Boolean),
    startupCommands: form.startupCommands.split('\n').map((item) => item.trim()).filter(Boolean),
    env,
    customFiles: form.customFiles
      .filter((file) => file.path.trim() || file.content)
      .map((file) => ({
        path: file.path,
        content: file.content,
      })),
  };
}

function parseEnvValue(entry: EnvEntry): Cs2EnvValue {
  if (entry.type === 'number') {
    const value = Number(entry.value);
    if (!Number.isFinite(value)) {
      throw new Error(`${entry.key || 'Env value'} must be a number`);
    }
    return value;
  }
  if (entry.type === 'boolean') {
    return entry.value === 'true';
  }
  return entry.value;
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${active ? 'bg-accent-primary text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
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

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm w-full">
      <span className="block mb-2">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
    </label>
  );
}
