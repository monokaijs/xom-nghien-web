"use client";

import React, { useEffect, useState } from 'react';
import { IconCheck, IconEdit, IconKey, IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react';

interface Credential {
  id: number;
  gameKey: string;
  type: string;
  name: string;
  isActive: number;
  assignedInstanceId: number | null;
}

const emptyForm = { name: '', value: '', isActive: true };

export default function GameCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCredentials = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const response = await fetch(`/api/admin/game-credentials?${params}`);
    const data = await response.json();
    setCredentials(data.credentials || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCredentials();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (credential: Credential) => {
    setEditing(credential);
    setForm({ name: credential.name, value: '', isActive: credential.isActive === 1 });
    setShowModal(true);
  };

  const saveCredential = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(editing ? `/api/admin/game-credentials/${editing.id}` : '/api/admin/game-credentials', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameKey: 'cs2', type: 'gslt', ...form }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to save credential');
      return;
    }
    setShowModal(false);
    await fetchCredentials();
  };

  const deleteCredential = async (credential: Credential) => {
    if (!confirm(`Delete ${credential.name}?`)) return;
    const response = await fetch(`/api/admin/game-credentials/${credential.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete credential');
      return;
    }
    await fetchCredentials();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Game Credentials</h2>
          <p className="text-white/50 text-sm">CS2 GSLT pool used one-per-running-instance.</p>
        </div>
        <button onClick={openCreate} className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <IconPlus size={18} /> Add GSLT
        </button>
      </div>

      <div className="bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 mb-6">
        <IconSearch size={18} className="text-white/40 mr-3" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credentials..." className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30" />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Game</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assigned</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">Loading...</td></tr>
            ) : credentials.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">No credentials configured</td></tr>
            ) : credentials.map((credential) => (
              <tr key={credential.id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-primary/20 text-accent-primary flex items-center justify-center"><IconKey size={18} /></div>
                    <span className="font-medium">{credential.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm uppercase">{credential.gameKey} / {credential.type}</td>
                <td className="px-5 py-4">
                  {credential.isActive ? <span className="text-green-300 inline-flex gap-1 items-center"><IconCheck size={14} /> Active</span> : <span className="text-red-300 inline-flex gap-1 items-center"><IconX size={14} /> Inactive</span>}
                </td>
                <td className="px-5 py-4 text-sm">{credential.assignedInstanceId ? `#${credential.assignedInstanceId}` : '-'}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(credential)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><IconEdit size={16} /></button>
                    <button onClick={() => deleteCredential(credential)} disabled={!!credential.assignedInstanceId} className="p-2 rounded-lg bg-red-500/20 text-red-400 disabled:opacity-40"><IconTrash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Edit GSLT' : 'Add GSLT'}</h3>
            <form onSubmit={saveCredential} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <Input label={editing ? 'New GSLT (optional)' : 'GSLT'} value={form.value} onChange={(value) => setForm({ ...form, value })} required={!editing} />
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

function Input({ label, value, onChange, required = true }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="block mb-2">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
    </label>
  );
}
