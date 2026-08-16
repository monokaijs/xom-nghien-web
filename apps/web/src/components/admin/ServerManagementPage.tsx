"use client";

import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconDeviceFloppy,
  IconExternalLink,
  IconKey,
  IconPlugConnected,
  IconRefresh,
  IconServer,
  IconSettings,
  IconTerminal2,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import ServerModPicker from '@/components/admin/ServerModPicker';
import ServerManagedConfigEditor from '@/components/admin/ServerManagedConfigEditor';
import { Games, getGame } from '@/config/games';
import type { ServerManagedConfig, ServerMod } from '@/types/server';

interface ManagedServer {
  id: number;
  name: string;
  game: string;
  gameName?: string;
  connectionLink: string | null;
  connectionHost: string | null;
  connectionPort: number | null;
  joinPassword: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
  rconHost: string | null;
  rconPort: number | null;
  rconConfigured: boolean;
  created_at: string;
  updated_at: string;
  mods: ServerMod[];
  managedConfigs: ServerManagedConfig[];
}

interface ServerForm {
  game: string;
  gameName: string;
  connectionLink: string;
  connectionHost: string;
  connectionPort: string;
  joinPassword: string;
  connectionGuide: string;
  description: string;
  metadataUrl: string;
  mods: ServerMod[];
  managedConfigs: ServerManagedConfig[];
}

interface ConsoleEntry {
  id: number;
  command: string;
  output: string;
  error: boolean;
  executedAt: string;
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50';

function toForm(server: ManagedServer): ServerForm {
  return {
    game: server.game,
    gameName: server.gameName || server.name,
    connectionLink: server.connectionLink || '',
    connectionHost: server.connectionHost || '',
    connectionPort: String(server.connectionPort || 2456),
    joinPassword: server.joinPassword || '',
    connectionGuide: server.connectionGuide || '',
    description: server.description || '',
    metadataUrl: server.metadataUrl || '',
    mods: server.mods || [],
    managedConfigs: server.managedConfigs || [],
  };
}

export default function ServerManagementPage({ serverId }: { serverId: string }) {
  const router = useRouter();
  const [server, setServer] = useState<ManagedServer | null>(null);
  const [form, setForm] = useState<ServerForm | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rcon'>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadServer = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load server');
      setServer(data.server);
      setForm(toForm(data.server));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load server');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    void loadServer();
  }, [loadServer]);

  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save server');
      setSaved(true);
      await loadServer();
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save server');
    } finally {
      setSaving(false);
    }
  };

  const removeServer = async () => {
    if (!server || !window.confirm(`Delete ${server.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete server');
      router.push('/admin/game-servers');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete server');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center text-white/45"><IconRefresh className="mr-2 animate-spin" size={18} /> Loading server...</div>;
  }

  if (!server || !form) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <h2 className="font-semibold text-red-200">Server unavailable</h2>
        <p className="mt-2 text-sm text-red-200/70">{error || 'This server could not be found.'}</p>
        <Link href="/admin/game-servers" className="mt-5 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><IconArrowLeft size={16} /> Back to servers</Link>
      </div>
    );
  }

  const game = getGame(server.game);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/game-servers" className="mb-4 inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"><IconArrowLeft size={16} /> Game servers</Link>
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 sm:flex-row sm:items-center">
          {game?.image ? <img src={game.image} alt="" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><IconServer size={30} /></div>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-bold tracking-tight">{server.name}</h2>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/55">{game?.name || server.game}</span>
              {server.game === 'cs2' && (
                <span className={`rounded-full px-2.5 py-1 text-xs ${server.rconConfigured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200'}`}>
                  RCON {server.rconConfigured ? 'ready' : 'not configured'}
                </span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-2 truncate text-sm text-white/45"><IconPlugConnected size={15} /> {server.connectionLink || 'No direct connection address'}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-white/30">Server ID</p>
            <p className="mt-1 font-mono text-sm text-white/65">#{server.id}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10" role="tablist" aria-label="Server management">
        <Tab active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<IconSettings size={17} />} label="Details & connection" />
        {server.game === 'cs2' && <Tab active={activeTab === 'rcon'} onClick={() => setActiveTab('rcon')} icon={<IconTerminal2 size={17} />} label="RCON console" badge={server.rconConfigured ? 'Ready' : undefined} />}
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {activeTab === 'details' ? (
        <form onSubmit={saveDetails} className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/5 bg-white/[0.035] p-5">
            <SectionHeading title="Server identity" description="What players see in the server directory." />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Game" required>
                <Select value={form.game} onChange={(event) => {
                  const nextGame = event.target.value;
                  setForm({
                    ...form,
                    game: nextGame,
                    mods: nextGame === form.game ? form.mods : [],
                    managedConfigs: nextGame === form.game ? form.managedConfigs : [],
                  });
                }} options={Games.map((item) => ({ value: item.id, label: item.name }))} size="lg" className="w-full" />
              </Field>
              <Field label="Server name" required>
                <input required maxLength={255} value={form.gameName} onChange={(event) => setForm({ ...form, gameName: event.target.value })} className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe this server to players..." className={`${inputClass} resize-y`} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.035] p-5">
            <SectionHeading title="Player connection" description="Direct connection details and instructions shown to players." />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Connection link" hint="A game protocol, web URL, or host:port">
                  <input maxLength={255} value={form.connectionLink} onChange={(event) => setForm({ ...form, connectionLink: event.target.value })} placeholder="server.example.com:27015" className={inputClass} />
                </Field>
              </div>
              {form.game === 'valheim' && <>
                <Field label="Launcher host" required><input required maxLength={255} value={form.connectionHost} onChange={(event) => setForm({ ...form, connectionHost: event.target.value })} className={inputClass} /></Field>
                <Field label="Launcher port" required><input required type="number" min={1} max={65535} value={form.connectionPort} onChange={(event) => setForm({ ...form, connectionPort: event.target.value })} className={inputClass} /></Field>
                <div className="md:col-span-2"><Field label="Join password" required hint="Kept private and sent only through the launcher."><input required type="password" autoComplete="new-password" maxLength={255} value={form.joinPassword} onChange={(event) => setForm({ ...form, joinPassword: event.target.value })} className={inputClass} /></Field></div>
              </>}
              <div className="md:col-span-2">
                <Field label="Connection guidance" hint="Shown before the player opens the direct connection.">
                  <textarea rows={5} maxLength={10000} value={form.connectionGuide} onChange={(event) => setForm({ ...form, connectionGuide: event.target.value })} placeholder="Open the game, choose multiplayer, then enter the server address..." className={`${inputClass} resize-y`} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Metadata URL" hint="Optional JSON status endpoint for non-CS2 servers.">
                  <input type="url" value={form.metadataUrl} onChange={(event) => setForm({ ...form, metadataUrl: event.target.value })} placeholder="https://api.example.com/servers/main" className={inputClass} />
                </Field>
              </div>
            </div>
          </section>

          <ServerModPicker game={form.game} mods={form.mods} onChange={(mods) => setForm((current) => current ? { ...current, mods } : current)} />

          <ServerManagedConfigEditor
            game={form.game}
            configs={form.managedConfigs}
            onChange={(managedConfigs) => setForm((current) => current ? { ...current, managedConfigs } : current)}
          />

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={removeServer} disabled={deleting || saving} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-40"><IconTrash size={17} /> {deleting ? 'Deleting...' : 'Delete server'}</button>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent-primary/80 disabled:opacity-50">
              {saved ? <IconCheck size={18} /> : <IconDeviceFloppy size={18} />}{saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <RconPanel server={server} onServerChange={(next) => setServer(next)} />
      )}
    </div>
  );
}

function RconPanel({ server, onServerChange }: { server: ManagedServer; onServerChange: (server: ManagedServer) => void }) {
  const [host, setHost] = useState(server.rconHost || '');
  const [port, setPort] = useState(String(server.rconPort || 27015));
  const [password, setPassword] = useState('');
  const [configOpen, setConfigOpen] = useState(!server.rconConfigured);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const commandInput = useRef<HTMLInputElement>(null);

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault();
    setConfigSaving(true);
    setConfigError(null);
    try {
      const response = await fetch(`/api/admin/servers/${server.id}/rcon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save RCON settings');
      setPassword('');
      setConfigOpen(false);
      onServerChange({ ...server, rconHost: data.rcon.host, rconPort: data.rcon.port, rconConfigured: true });
    } catch (saveError) {
      setConfigError(saveError instanceof Error ? saveError.message : 'Failed to save RCON settings');
    } finally {
      setConfigSaving(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Remove the stored RCON endpoint and password?')) return;
    setConfigSaving(true);
    setConfigError(null);
    try {
      const response = await fetch(`/api/admin/servers/${server.id}/rcon`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove RCON settings');
      onServerChange({ ...server, rconHost: null, rconPort: null, rconConfigured: false });
      setConfigOpen(true);
      setEntries([]);
    } catch (removeError) {
      setConfigError(removeError instanceof Error ? removeError.message : 'Failed to remove RCON settings');
    } finally {
      setConfigSaving(false);
    }
  };

  const runCommand = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const nextCommand = (preset || command).trim();
    if (!nextCommand || running || !server.rconConfigured) return;
    setRunning(true);
    setCommand('');
    try {
      const response = await fetch(`/api/admin/servers/${server.id}/rcon/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: nextCommand }),
      });
      const data = await response.json();
      setEntries((current) => [...current, {
        id: Date.now(),
        command: nextCommand,
        output: response.ok ? (data.output || 'Command completed with no output.') : (data.error || 'Command failed'),
        error: !response.ok,
        executedAt: data.executedAt || new Date().toISOString(),
      }]);
    } catch {
      setEntries((current) => [...current, { id: Date.now(), command: nextCommand, output: 'Could not reach the management API.', error: true, executedAt: new Date().toISOString() }]);
    } finally {
      setRunning(false);
      window.setTimeout(() => commandInput.current?.focus(), 0);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#110a0c] shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${server.rconConfigured ? 'bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153/0.7)]' : 'bg-white/25'}`} />
            <span className="font-medium">CS2 RCON</span>
            <span className="font-mono text-xs text-white/35">{server.rconConfigured ? `${server.rconHost}:${server.rconPort}` : 'Not configured'}</span>
          </div>
          <button type="button" onClick={() => setEntries([])} disabled={entries.length === 0} className="text-xs text-white/35 hover:text-white disabled:opacity-30">Clear output</button>
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 font-mono text-[13px] leading-6">
          {entries.length === 0 ? (
            <div className="m-auto max-w-sm text-center font-sans text-white/35">
              <IconTerminal2 size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-white/55">RCON command console</p>
              <p className="mt-1 text-sm">Run a quick command or type one below. Responses appear here and are not stored.</p>
            </div>
          ) : entries.map((entry) => (
            <div key={entry.id}>
              <div className="flex items-start gap-2 text-emerald-300"><span className="select-none text-white/25">$</span><span className="break-all">{entry.command}</span></div>
              <pre className={`mt-1 whitespace-pre-wrap break-words font-mono ${entry.error ? 'text-red-300' : 'text-white/65'}`}>{entry.output}</pre>
              <p className="mt-1 text-[10px] text-white/20">{new Date(entry.executedAt).toLocaleTimeString()}</p>
            </div>
          ))}
          {running && <div className="flex items-center gap-2 text-white/35"><IconRefresh size={14} className="animate-spin" /> Waiting for server...</div>}
        </div>
        <form onSubmit={(event) => void runCommand(event)} className="flex items-center gap-2 border-t border-white/10 bg-white/[0.025] p-3">
          <span className="select-none font-mono text-emerald-300">$</span>
          <input ref={commandInput} value={command} onChange={(event) => setCommand(event.target.value)} disabled={!server.rconConfigured || running} maxLength={500} autoComplete="off" spellCheck={false} aria-label="RCON command" placeholder={server.rconConfigured ? 'Enter a command, e.g. status' : 'Configure RCON to enable the console'} className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm text-white outline-none placeholder:text-white/25 disabled:cursor-not-allowed" />
          <button disabled={!server.rconConfigured || running || !command.trim()} className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-xs font-semibold disabled:opacity-35"><IconBolt size={15} /> Run</button>
        </form>
      </section>

      <aside className="flex flex-col gap-5">
        <section className="rounded-2xl border border-white/5 bg-white/[0.035] p-4">
          <h3 className="flex items-center gap-2 font-semibold"><IconBolt size={18} className="text-amber-300" /> Quick commands</h3>
          <div className="mt-3 flex flex-col gap-2">
            {[
              ['status', 'Server & players', IconUsers],
              ['stats', 'Performance stats', IconBolt],
              ['maps *', 'Available maps', IconExternalLink],
              ['sv_password', 'Join password status', IconKey],
            ].map(([value, label, CommandIcon]) => (
              <button key={String(value)} type="button" disabled={!server.rconConfigured || running} onClick={() => void runCommand(undefined, String(value))} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5 text-left text-sm text-white/65 transition-colors hover:border-white/10 hover:bg-white/[0.07] hover:text-white disabled:opacity-35">
                <span className="flex items-center gap-2"><CommandIcon size={16} /> {String(label)}</span><IconChevronRight size={15} className="text-white/25" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-white/[0.035] p-4">
          <button type="button" onClick={() => setConfigOpen(!configOpen)} className="flex w-full items-center justify-between text-left">
            <span><span className="block font-semibold">Connection settings</span><span className="mt-1 block text-xs text-white/35">Credentials stay on the server.</span></span>
            <IconSettings size={18} className="text-white/40" />
          </button>
          {configOpen && (
            <form onSubmit={saveConfig} className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
              <Field label="RCON host" required><input required maxLength={255} value={host} onChange={(event) => setHost(event.target.value)} placeholder="cs2.example.com" className={inputClass} /></Field>
              <Field label="RCON port" required><input required type="number" min={1} max={65535} value={port} onChange={(event) => setPort(event.target.value)} className={inputClass} /></Field>
              <Field label="RCON password" required={!server.rconConfigured} hint={server.rconConfigured ? 'Leave blank to keep the current password.' : undefined}><input required={!server.rconConfigured} type="password" autoComplete="new-password" maxLength={255} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={server.rconConfigured ? 'Unchanged' : 'Enter password'} className={inputClass} /></Field>
              {configError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">{configError}</p>}
              <button disabled={configSaving} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/15 disabled:opacity-40"><IconDeviceFloppy size={16} /> {configSaving ? 'Saving...' : 'Save RCON settings'}</button>
              {server.rconConfigured && <button type="button" onClick={() => void disconnect()} disabled={configSaving} className="text-xs text-red-300/70 hover:text-red-300 disabled:opacity-40">Remove stored credentials</button>}
            </form>
          )}
        </section>
      </aside>
    </div>
  );
}

function Tab({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-colors ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>{icon}{label}{badge && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">{badge}</span>}{active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-primary" />}</button>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-white/40">{description}</p></div>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm"><span className="font-medium">{label}{required && <span className="ml-1 text-accent-primary">*</span>}</span>{children}{hint && <span className="text-xs text-white/35">{hint}</span>}</label>;
}
