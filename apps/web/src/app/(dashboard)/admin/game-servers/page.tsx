"use client";

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  IconBook,
  IconDeviceFloppy,
  IconEdit,
  IconExternalLink,
  IconGripVertical,
  IconLink,
  IconPlus,
  IconServer,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import { Games, getGame } from '@/config/games';

interface ManagedServer {
  id: number;
  name: string;
  gameName?: string;
  game: string;
  connectionLink: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
}

interface ServerForm {
  game: string;
  gameName: string;
  connectionLink: string;
  connectionGuide: string;
  description: string;
  metadataUrl: string;
}

const emptyForm: ServerForm = {
  game: Games[0].id,
  gameName: Games[0].name,
  connectionLink: '',
  connectionGuide: '',
  description: '',
  metadataUrl: '',
};

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-colors placeholder:text-white/25';

export default function GameServersPage() {
  const [servers, setServers] = useState<ManagedServer[]>([]);
  const [form, setForm] = useState<ServerForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/servers');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load servers');
      setServers(data.servers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const closeDialog = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setDialogOpen(false);
  };

  const create = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(editingId ? `/api/admin/servers/${editingId}` : '/api/admin/servers', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save server');
      closeDialog();
      await fetchServers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setSaving(false);
    }
  };

  const edit = (server: ManagedServer) => {
    setEditingId(server.id);
    setForm({
      game: server.game,
      gameName: server.gameName || server.name || getGame(server.game)?.name || '',
      connectionLink: server.connectionLink || '',
      connectionGuide: server.connectionGuide || '',
      description: server.description || '',
      metadataUrl: server.metadataUrl || '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const remove = async (server: ManagedServer) => {
    if (!window.confirm(`Remove ${server.name || getGame(server.game)?.name}?`)) return;
    try {
      setError(null);
      const response = await fetch(`/api/admin/servers/${server.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove server');
      if (editingId === server.id) closeDialog();
      await fetchServers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove server');
    }
  };

  const setGame = (gameId: string) => {
    const previousDefaultName = getGame(form.game)?.name;
    const nextDefaultName = getGame(gameId)?.name || '';
    const shouldUseDefaultName = !form.gameName || form.gameName === previousDefaultName;
    setForm({
      ...form,
      game: gameId,
      gameName: shouldUseDefaultName ? nextDefaultName : form.gameName,
    });
  };

  const reorderServers = async (sourceId: number, targetId: number) => {
    if (sourceId === targetId || reordering) return;

    const previous = [...servers];
    const sourceIndex = servers.findIndex((server) => server.id === sourceId);
    const targetIndex = servers.findIndex((server) => server.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...servers];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setServers(next);
    setReordering(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/servers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverIds: next.map((server) => server.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reorder servers');
    } catch (err) {
      setServers(previous);
      setError(err instanceof Error ? err.message : 'Failed to reorder servers');
    } finally {
      setReordering(false);
      setDraggingId(null);
      setDragOverId(null);
    }
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) closeDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, saving]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Game Servers</h2>
          <p className="text-white/50 text-sm">Drag servers to control the order shown to players.</p>
        </div>
        <button
          type="button"
          onClick={create}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent-primary/80"
        >
          <IconPlus size={18} />
          Add server
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>}

      <section>
        <h3 className="font-semibold mb-3">Server list</h3>
        {loading ? (
          <div className="text-white/50 py-8 text-center">Loading...</div>
        ) : servers.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-10 text-center text-white/50">
            <IconServer size={36} className="mx-auto mb-3 opacity-40" />
            No servers yet. Add the first one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {servers.map((server) => {
              const game = getGame(server.game);
              return (
                <article
                  key={server.id}
                  draggable={!reordering}
                  onDragStart={(event) => {
                    setDraggingId(server.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(server.id));
                  }}
                  onDragOver={(event) => {
                    if (draggingId === null || draggingId === server.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverId(server.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = Number(event.dataTransfer.getData('text/plain')) || draggingId;
                    if (sourceId !== null) void reorderServers(sourceId, server.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={`flex gap-3 rounded-2xl border p-4 transition-all ${
                    draggingId === server.id
                      ? 'border-accent-primary/40 bg-accent-primary/10 opacity-60'
                      : dragOverId === server.id
                        ? 'border-accent-primary bg-white/10'
                        : 'border-white/5 bg-white/5'
                  } ${reordering ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  <div className="flex shrink-0 items-center text-white/25" title="Drag to reorder">
                    <IconGripVertical size={20} />
                  </div>
                  {game?.image ? (
                    <img src={game.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"><IconServer /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium">{server.name || game?.name}</h4>
                    <p className="text-xs text-white/35 truncate mt-0.5">{game?.name || server.game}</p>
                    <p className="text-sm text-white/50 truncate mt-2 flex items-center gap-1.5">
                      <IconLink size={14} />
                      {server.connectionLink || 'No direct link'}
                    </p>
                    {server.connectionGuide && (
                      <p className="text-sm text-white/50 truncate mt-1 flex items-center gap-1.5">
                        <IconBook size={14} />
                        Guidance configured
                      </p>
                    )}
                    {server.description && <p className="text-sm text-white/60 mt-2 line-clamp-2">{server.description}</p>}
                    {server.metadataUrl && <p className="text-xs text-white/35 truncate mt-2 flex items-center gap-1.5"><IconExternalLink size={13} /> {server.metadataUrl}</p>}
                  </div>
                  <div className="flex gap-1 self-start">
                    <button onClick={() => edit(server)} className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white" title="Edit"><IconEdit size={16} /></button>
                    <button onClick={() => remove(server)} className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25" title="Remove"><IconTrash size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="server-form-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeDialog();
          }}
        >
          <form
            onSubmit={submit}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-sidebar shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <h3 id="server-form-title" className="font-semibold">{editingId ? 'Edit server' : 'Add server'}</h3>
                <p className="mt-1 text-xs text-white/40">Add a direct address, guidance, or both.</p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Close server form"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Game" required>
                  <Select
                    value={form.game}
                    onChange={(event) => setGame(event.target.value)}
                    options={Games.map((game) => ({ value: game.id, label: game.name }))}
                    size="lg"
                    className="w-full"
                  />
                </Field>

                <Field label="Server game name" required>
                  <input
                    autoFocus
                    required
                    maxLength={255}
                    value={form.gameName}
                    onChange={(event) => setForm({ ...form, gameName: event.target.value })}
                    placeholder="Community Palworld"
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Connection link" hint="A game protocol, web URL, or host:port">
                    <input
                      maxLength={255}
                      value={form.connectionLink}
                      onChange={(event) => setForm({ ...form, connectionLink: event.target.value })}
                      placeholder={form.game === 'palworld' ? 'server.example.com:8211' : 'steam://run/730//+connect server.example.com:27015'}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Connection guidance" hint="Shown before players open the direct connection">
                <textarea
                  rows={5}
                  maxLength={10000}
                  value={form.connectionGuide}
                  onChange={(event) => setForm({ ...form, connectionGuide: event.target.value })}
                  placeholder={`Open the game, choose multiplayer, then enter the server address.\nAdd passwords, ports, or screenshot links here if needed.`}
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Tell players what this server is for..."
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <Field label="Metadata URL" hint="Optional JSON endpoint for non-CS2 server status, player counts, map, and ping">
                <input
                  type="url"
                  value={form.metadataUrl}
                  onChange={(event) => setForm({ ...form, metadataUrl: event.target.value })}
                  placeholder="https://api.example.com/servers/main"
                  className={inputClass}
                />
              </Field>

              {formError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{formError}</div>}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 py-2.5 font-medium transition-colors hover:bg-accent-primary/80 disabled:opacity-50"
              >
                {editingId ? <IconDeviceFloppy size={18} /> : <IconPlus size={18} />}
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add server'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}{required && <span className="text-accent-primary ml-1">*</span>}</span>
      {children}
      {hint && <span className="text-xs text-white/35">{hint}</span>}
    </label>
  );
}
