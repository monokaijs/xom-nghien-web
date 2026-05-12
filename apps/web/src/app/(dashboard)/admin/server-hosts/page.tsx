"use client";

import React, { useEffect, useState } from 'react';
import { IconCheck, IconEdit, IconPlus, IconSearch, IconServer, IconTrash, IconX } from '@tabler/icons-react';

interface ServerHost {
  id: number;
  name: string;
  publicAddress: string;
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  baseDeployPath: string;
  portRangeStart: number;
  portRangeEnd: number;
  maxInstances: number;
  enabled: number;
  healthStatus: string;
}

const emptyForm = {
  name: '',
  publicAddress: '',
  sshHost: '',
  sshPort: 22,
  sshUsername: 'root',
  privateKey: '',
  baseDeployPath: '~/game-servers',
  portRangeStart: 27015,
  portRangeEnd: 27100,
  maxInstances: 5,
  enabled: true,
};

export default function ServerHostsPage() {
  const [hosts, setHosts] = useState<ServerHost[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServerHost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchHosts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const response = await fetch(`/api/admin/server-hosts?${params}`);
    const data = await response.json();
    setHosts(data.hosts || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHosts();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (host: ServerHost) => {
    setEditing(host);
    setForm({
      name: host.name,
      publicAddress: host.publicAddress,
      sshHost: host.sshHost,
      sshPort: host.sshPort,
      sshUsername: host.sshUsername,
      privateKey: '',
      baseDeployPath: host.baseDeployPath,
      portRangeStart: host.portRangeStart,
      portRangeEnd: host.portRangeEnd,
      maxInstances: host.maxInstances,
      enabled: host.enabled === 1,
    });
    setShowModal(true);
  };

  const saveHost = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/admin/server-hosts/${editing.id}` : '/api/admin/server-hosts', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save host');
      setShowModal(false);
      await fetchHosts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteHost = async (host: ServerHost) => {
    if (!confirm(`Delete ${host.name}?`)) return;
    const response = await fetch(`/api/admin/server-hosts/${host.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete host');
      return;
    }
    await fetchHosts();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">CS2 Hosts</h2>
          <p className="text-white/50 text-sm">SSH Docker hosts available for game server deployment.</p>
        </div>
        <button onClick={openCreate} className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <IconPlus size={18} /> Add Host
        </button>
      </div>

      <div className="bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 mb-6">
        <IconSearch size={18} className="text-white/40 mr-3" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hosts..." className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30" />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-5 py-3">Host</th>
              <th className="px-5 py-3">SSH</th>
              <th className="px-5 py-3">Ports</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">Loading...</td></tr>
            ) : hosts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">No hosts configured</td></tr>
            ) : hosts.map((host) => (
              <tr key={host.id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-primary/20 text-accent-primary flex items-center justify-center">
                      <IconServer size={18} />
                    </div>
                    <div>
                      <div className="font-medium">{host.name}</div>
                      <div className="text-xs text-white/50">{host.publicAddress}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-white/70">{host.sshUsername}@{host.sshHost}:{host.sshPort}</td>
                <td className="px-5 py-4 text-sm text-white/70">{host.portRangeStart}-{host.portRangeEnd} / {host.maxInstances}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${host.enabled ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {host.enabled ? <IconCheck size={13} /> : <IconX size={13} />} {host.healthStatus}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(host)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><IconEdit size={16} /></button>
                    <button onClick={() => deleteHost(host)} className="p-2 rounded-lg bg-red-500/20 text-red-400"><IconTrash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editing ? 'Edit Host' : 'Add Host'}</h3>
            <form onSubmit={saveHost} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <Input label="Public Address" value={form.publicAddress} onChange={(value) => setForm({ ...form, publicAddress: value })} />
                <Input label="SSH Host" value={form.sshHost} onChange={(value) => setForm({ ...form, sshHost: value })} />
                <Input label="SSH Port" type="number" value={form.sshPort} onChange={(value) => setForm({ ...form, sshPort: Number(value) })} />
                <Input label="SSH Username" value={form.sshUsername} onChange={(value) => setForm({ ...form, sshUsername: value })} />
                <Input label="Base Deploy Path" value={form.baseDeployPath} onChange={(value) => setForm({ ...form, baseDeployPath: value })} />
                <Input label="Port Range Start" type="number" value={form.portRangeStart} onChange={(value) => setForm({ ...form, portRangeStart: Number(value) })} />
                <Input label="Port Range End" type="number" value={form.portRangeEnd} onChange={(value) => setForm({ ...form, portRangeEnd: Number(value) })} />
                <Input label="Max Instances" type="number" value={form.maxInstances} onChange={(value) => setForm({ ...form, maxInstances: Number(value) })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                Enabled
              </label>
              <div>
                <label className="block text-sm mb-2">Private Key {editing && <span className="text-white/40">(leave blank to keep current)</span>}</label>
                <textarea value={form.privateKey} onChange={(e) => setForm({ ...form, privateKey: e.target.value })} required={!editing} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white font-mono text-sm min-h-[140px]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button disabled={saving} className="flex-1 bg-accent-primary text-white rounded-lg px-4 py-2 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/10 rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="block mb-2">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
    </label>
  );
}
