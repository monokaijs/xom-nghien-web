"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconEdit,
  IconFileUpload,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconTrash,
} from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import type { ValheimConfigTarget, ValheimManifestPackage } from '@/types/valheim';

interface ManagedConfig {
  id: number;
  path: string;
  content: string;
  target: ValheimConfigTarget;
  enabled: number;
  updated_at: string;
}

interface ManifestInfo {
  manifestId: string;
  manifestPath: string;
  packages: ValheimManifestPackage[];
  serverRevision: string | null;
  clientRevision: string | null;
  publishedAt: string | null;
}

const TARGET_OPTIONS = [
  { value: 'server', label: 'Server only' },
  { value: 'client', label: 'Client only' },
  { value: 'both', label: 'Server and client' },
];

const EMPTY_FORM = {
  path: '',
  content: '',
  target: 'server' as ValheimConfigTarget,
  enabled: true,
};

export default function ValheimServerConfigPage() {
  const params = useParams<{ id: string }>();
  const serverId = params.id;
  const fileInput = useRef<HTMLInputElement>(null);
  const [manifest, setManifest] = useState<ManifestInfo | null>(null);
  const [configs, setConfigs] = useState<ManagedConfig[]>([]);
  const [packagesText, setPackagesText] = useState('[]');
  const [editing, setEditing] = useState<ManagedConfig | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/valheim`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load Valheim settings');
      setManifest(data.manifest);
      setConfigs(data.configs);
      setPackagesText(JSON.stringify(data.manifest.packages || [], null, 2));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load Valheim settings');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { void load(); }, [load]);

  const request = async (url: string, options: RequestInit) => {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const savePackages = async () => {
    let packages: unknown;
    try { packages = JSON.parse(packagesText); }
    catch { throw new Error('Packages must be valid JSON'); }
    await request(`/api/admin/servers/${serverId}/valheim`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages }),
    });
  };

  const publish = async () => {
    if (!confirm('Publish these packages and configs to the Valheim server?')) return;
    setSaving(true);
    setMessage(null);
    try {
      await savePackages();
      const data = await request(`/api/admin/servers/${serverId}/valheim`, { method: 'POST' });
      setMessage(`Published server revision ${data.manifest.revision.slice(0, 12)}`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowEditor(true);
  };

  const openEdit = (config: ManagedConfig) => {
    setEditing(config);
    setForm({ path: config.path, content: config.content, target: config.target, enabled: config.enabled === 1 });
    setShowEditor(true);
  };

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const url = editing
        ? `/api/admin/servers/${serverId}/valheim/configs/${editing.id}`
        : `/api/admin/servers/${serverId}/valheim/configs`;
      await request(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowEditor(false);
      setMessage('Draft saved. Publish when you are ready to deploy it.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save config');
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (config: ManagedConfig) => {
    if (!confirm(`Delete draft config ${config.path}? The published version remains active until you publish again.`)) return;
    setSaving(true);
    try {
      await request(`/api/admin/servers/${serverId}/valheim/configs/${config.id}`, { method: 'DELETE' });
      setMessage('Draft deleted. Publish to remove it from managed servers.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete config');
    } finally {
      setSaving(false);
    }
  };

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setForm((current) => ({ ...current, path: current.path || file.name, content }));
    event.target.value = '';
  };

  const copyManifestUrl = async () => {
    if (!manifest) return;
    await navigator.clipboard.writeText(`${window.location.origin}${manifest.manifestPath}`);
    setMessage('Manifest URL copied. Put it in the dedicated server bootstrap.cfg.');
  };

  if (loading && !manifest) return <div className="p-8 text-white/60">Loading Valheim configuration…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/servers" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold">Valheim Mods · Server #{serverId}</h2>
            <p className="text-sm text-white/50">Edit drafts, then publish one atomic manifest release.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={saving} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50" title="Refresh">
            <IconRefresh size={20} />
          </button>
          <button onClick={() => void publish()} disabled={saving} className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80 flex items-center gap-2 disabled:opacity-50">
            <IconRocket size={19} /> {saving ? 'Working…' : 'Publish'}
          </button>
        </div>
      </div>

      {message && <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">{message}</div>}

      {manifest && (
        <section className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Dedicated server manifest</h3>
              <p className="text-xs text-white/45 mt-1">The tokenized URL can read server-only content. Treat it like a password.</p>
            </div>
            <button onClick={() => void copyManifestUrl()} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 flex items-center gap-2 text-sm">
              <IconCopy size={17} /> Copy URL
            </button>
          </div>
          <code className="block overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-amber-200">{manifest.manifestPath}</code>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div><span className="text-white/45">Published</span><div>{manifest.publishedAt ? new Date(manifest.publishedAt).toLocaleString() : 'Never'}</div></div>
            <div><span className="text-white/45">Server revision</span><div className="font-mono">{manifest.serverRevision?.slice(0, 12) || '—'}</div></div>
            <div><span className="text-white/45">Client revision</span><div className="font-mono">{manifest.clientRevision?.slice(0, 12) || '—'}</div></div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-3">
        <div>
          <h3 className="font-semibold">Thunderstore packages</h3>
          <p className="text-xs text-white/45 mt-1">Exact bootstrap package objects as a JSON array. Package changes require a Valheim restart.</p>
        </div>
        <textarea
          value={packagesText}
          onChange={(event) => setPackagesText(event.target.value)}
          spellCheck={false}
          className="w-full min-h-52 rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs outline-none focus:border-accent-primary/60"
        />
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
        <div className="p-5 flex items-center justify-between gap-4 border-b border-white/5">
          <div>
            <h3 className="font-semibold">Managed config drafts</h3>
            <p className="text-xs text-white/45 mt-1">Paths are relative to BepInEx/config. New configs default to server-only.</p>
          </div>
          <button onClick={openNew} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 flex items-center gap-2 text-sm">
            <IconPlus size={18} /> Add config
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-white/40 bg-white/[0.03]">
              <tr><th className="px-5 py-3">Path</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">State</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {configs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/45">No managed configs yet.</td></tr>
              ) : configs.map((config) => (
                <tr key={config.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono text-sm">{config.path}</td>
                  <td className="px-5 py-3"><span className="rounded-full bg-amber-500/15 text-amber-200 px-2.5 py-1 text-xs">{config.target}</span></td>
                  <td className="px-5 py-3 text-sm">{config.enabled ? <span className="text-emerald-300 flex items-center gap-1"><IconCheck size={15} /> Enabled</span> : <span className="text-white/40">Disabled</span>}</td>
                  <td className="px-5 py-3"><div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(config)} className="p-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"><IconEdit size={17} /></button>
                    <button onClick={() => void deleteConfig(config)} className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"><IconTrash size={17} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <form onSubmit={saveConfig} className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-bg-panel border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">{editing ? 'Edit config' : 'Add config'}</h3>
              <button type="button" onClick={() => fileInput.current?.click()} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 flex items-center gap-2 text-sm">
                <IconFileUpload size={17} /> Import file
              </button>
              <input ref={fileInput} type="file" className="hidden" accept=".cfg,.yml,.yaml,.json,.toml,.txt" onChange={(event) => void importFile(event)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <label className="space-y-2 text-sm"><span>Path relative to BepInEx/config</span>
                <input required value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} placeholder="Azumatt.AzuAntiCheat.cfg" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono outline-none focus:border-accent-primary/60" />
              </label>
              <label className="space-y-2 text-sm"><span>Target</span>
                <Select options={TARGET_OPTIONS} value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value as ValheimConfigTarget })} className="w-full" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Include in next publish</label>
            <label className="space-y-2 text-sm block"><span>Content</span>
              <textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} spellCheck={false} className="w-full min-h-96 rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs outline-none focus:border-accent-primary/60" />
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-accent-primary hover:bg-accent-primary/80 px-4 py-2.5 disabled:opacity-50">Save draft</button>
              <button type="button" onClick={() => setShowEditor(false)} disabled={saving} className="flex-1 rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2.5 disabled:opacity-50">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
