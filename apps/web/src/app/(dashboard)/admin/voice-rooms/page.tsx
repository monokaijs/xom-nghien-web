"use client";

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  IconCopy,
  IconEdit,
  IconHeadphones,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import type { VoiceRoom, VoiceRoomSnapshot } from '@xom/voice-contracts';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || 'Request failed');
  return data;
}

export default function AdminVoiceRoomsPage() {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VoiceRoom | null>(null);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      await request('/api/voice/session', { method: 'POST', body: '{}' });
      const result = await request<{ rooms: VoiceRoom[] }>('/api/voice/rooms?scope=admin');
      setRooms(result.rooms);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải voice rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setVisibility('public');
    setAccessCode(null);
    setDialogOpen(true);
  };

  const openEdit = (room: VoiceRoom) => {
    setEditing(room);
    setName(room.name);
    setVisibility(room.visibility);
    setAccessCode(null);
    setDialogOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const result = await request<{ snapshot: VoiceRoomSnapshot; accessCode?: string }>(`/api/voice/rooms/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, visibility }),
        });
        setAccessCode(result.accessCode || null);
        setRooms((current) => current.map((room) => room.id === editing.id ? result.snapshot.room : room));
      } else {
        const result = await request<{ snapshot: VoiceRoomSnapshot; accessCode?: string }>('/api/voice/rooms', {
          method: 'POST',
          body: JSON.stringify({ name, visibility, persistent: true }),
        });
        setAccessCode(result.accessCode || null);
        setRooms((current) => [result.snapshot.room, ...current]);
        setEditing(result.snapshot.room);
      }
      setError(null);
      if (visibility === 'public') setDialogOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu phòng');
    } finally {
      setSaving(false);
    }
  };

  const rotate = async (room: VoiceRoom) => {
    try {
      const result = await request<{ accessCode: string }>(`/api/voice/rooms/${room.id}/code`, { method: 'POST' });
      setEditing(room);
      setName(room.name);
      setVisibility(room.visibility);
      setAccessCode(result.accessCode);
      setDialogOpen(true);
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : 'Không thể đổi mã');
    }
  };

  const remove = async (room: VoiceRoom) => {
    if (!window.confirm(`Xóa phòng “${room.name}”?`)) return;
    try {
      await request(`/api/voice/rooms/${room.id}`, { method: 'DELETE' });
      setRooms((current) => current.filter((item) => item.id !== room.id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Không thể xóa phòng');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="flex items-center gap-2 text-xl font-bold"><IconHeadphones className="text-accent-primary" /> Voice Rooms</h2><p className="mt-1 text-sm text-white/45">Tạo và quản lý các phòng persistent. Presence được cập nhật mỗi 10 giây.</p></div>
        <div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-white/10 bg-white/5 p-2.5"><IconRefresh size={18} /></button><button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-medium"><IconPlus size={18} /> Tạo phòng persistent</button></div>
      </div>
      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading ? <div className="py-12 text-center text-white/40">Đang tải…</div> : rooms.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/40">Chưa có voice room.</div> : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {rooms.map((room) => <article key={room.id} className="rounded-2xl border border-white/8 bg-white/4 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{room.name}</h3>{room.persistent && <IconShield size={15} className="text-amber-300" />}{room.visibility === 'private' ? <IconLock size={15} className="text-amber-300" /> : <IconLockOpen size={15} className="text-emerald-300" />}</div><p className="mt-1 text-xs text-white/40">Chủ phòng: {room.ownerName}</p><p className="mt-2 flex items-center gap-1 text-sm text-white/60"><IconUsers size={15} /> {room.participantCount}/{room.maxParticipants} người</p></div><div className="flex gap-1">{room.visibility === 'private' && <button onClick={() => void rotate(room)} className="rounded-lg p-2 text-white/60 hover:bg-white/8 hover:text-white" title="Đổi mã"><IconRefresh size={17} /></button>}<button onClick={() => openEdit(room)} className="rounded-lg p-2 text-white/60 hover:bg-white/8 hover:text-white"><IconEdit size={17} /></button><button onClick={() => void remove(room)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"><IconTrash size={17} /></button></div></div></article>)}
        </div>
      )}

      {dialogOpen && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}><form onSubmit={save} className="w-full max-w-md rounded-3xl border border-white/10 bg-bg-sidebar p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-xl font-bold">{editing ? 'Sửa Voice Room' : 'Tạo Voice Room'}</h3><button type="button" onClick={() => setDialogOpen(false)}><IconX /></button></div><label className="mt-6 block text-sm text-white/60">Tên phòng</label><input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={80} required className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent-primary" /><label className="mt-5 block text-sm text-white/60">Quyền truy cập</label><div className="mt-2 grid grid-cols-2 gap-3"><button type="button" onClick={() => setVisibility('public')} className={`rounded-xl border p-3 ${visibility === 'public' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}>Công khai</button><button type="button" onClick={() => setVisibility('private')} className={`rounded-xl border p-3 ${visibility === 'private' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}>Riêng tư</button></div>{accessCode && <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="text-xs text-amber-100/60">Mã mới — sao chép ngay</p><div className="mt-2 flex items-center justify-between"><strong className="tracking-[0.3em] text-amber-200">{accessCode}</strong><button type="button" onClick={() => void navigator.clipboard.writeText(accessCode)}><IconCopy size={18} /></button></div></div>}<button disabled={saving} className="mt-6 w-full rounded-xl bg-accent-primary px-4 py-3 font-semibold disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu phòng'}</button></form></div>}
    </div>
  );
}
