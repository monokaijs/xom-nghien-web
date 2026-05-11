"use client";

import React, { useEffect, useState } from 'react';
import { IconPlayerPlay, IconRefresh, IconRotateClockwise, IconServer, IconTrash, IconX } from '@tabler/icons-react';

interface Config {
  id: number;
  name: string;
  isActive: number;
  currentVersion: { versionNumber: number } | null;
}

interface Host {
  id: number;
  name: string;
  publicAddress: string;
  enabled: number;
}

interface Deployment {
  id: number;
  name: string;
  status: string;
  totalCount: number;
  queuedCount: number;
  succeededCount: number;
  failedCount: number;
  created_at: string;
}

interface Instance {
  id: number;
  name: string;
  gameKey: string;
  status: string;
  desiredState: string;
  connectAddress: string | null;
  hostName: string;
  configurationName: string;
  lastError: string | null;
}

export default function GameServersPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<number[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<number[]>([]);
  const [deploying, setDeploying] = useState(false);

  const fetchAll = async () => {
    const [configsRes, hostsRes, deploymentsRes, instancesRes] = await Promise.all([
      fetch('/api/admin/game-configurations'),
      fetch('/api/admin/server-hosts'),
      fetch('/api/admin/game-server-deployments'),
      fetch('/api/admin/game-server-instances'),
    ]);
    const [configsData, hostsData, deploymentsData, instancesData] = await Promise.all([
      configsRes.json(),
      hostsRes.json(),
      deploymentsRes.json(),
      instancesRes.json(),
    ]);
    setConfigs((configsData.configurations || []).filter((config: Config) => config.isActive));
    setHosts((hostsData.hosts || []).filter((host: Host) => host.enabled));
    setDeployments(deploymentsData.deployments || []);
    setInstances(instancesData.instances || []);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (id: number, values: number[], setter: (value: number[]) => void) => {
    setter(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  };

  const deploy = async () => {
    if (selectedConfigs.length === 0 || selectedHosts.length === 0) {
      alert('Select at least one configuration and one host');
      return;
    }
    setDeploying(true);
    try {
      const response = await fetch('/api/admin/game-server-deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configurationIds: selectedConfigs, hostIds: selectedHosts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to deploy');
      setSelectedConfigs([]);
      setSelectedHosts([]);
      await fetchAll();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeploying(false);
    }
  };

  const action = async (instance: Instance, actionName: string) => {
    const response = await fetch(`/api/admin/game-server-instances/${instance.id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to queue action');
      return;
    }
    await fetchAll();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Game Servers</h2>
          <p className="text-white/50 text-sm">Deploy saved configurations to one or more SSH Docker hosts.</p>
        </div>
        <button onClick={fetchAll} className="bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2 flex items-center gap-2">
          <IconRefresh size={18} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SelectionPanel title="Configurations" empty="No active configurations">
          {configs.map((config) => (
            <label key={config.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5">
              <span>
                <span className="font-medium">{config.name}</span>
                <span className="text-xs text-white/40 ml-2">v{config.currentVersion?.versionNumber || 0}</span>
              </span>
              <input type="checkbox" checked={selectedConfigs.includes(config.id)} onChange={() => toggle(config.id, selectedConfigs, setSelectedConfigs)} />
            </label>
          ))}
        </SelectionPanel>

        <SelectionPanel title="Hosts" empty="No enabled hosts">
          {hosts.map((host) => (
            <label key={host.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5">
              <span>
                <span className="font-medium">{host.name}</span>
                <span className="text-xs text-white/40 ml-2">{host.publicAddress}</span>
              </span>
              <input type="checkbox" checked={selectedHosts.includes(host.id)} onChange={() => toggle(host.id, selectedHosts, setSelectedHosts)} />
            </label>
          ))}
        </SelectionPanel>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
        <div className="text-sm text-white/60">
          Matrix size: <span className="text-white font-medium">{selectedConfigs.length * selectedHosts.length}</span> instance(s)
        </div>
        <button disabled={deploying || selectedConfigs.length === 0 || selectedHosts.length === 0} onClick={deploy} className="bg-accent-primary hover:bg-accent-primary/80 disabled:opacity-40 rounded-lg px-5 py-2 text-white">
          {deploying ? 'Queueing...' : 'Deploy Selected'}
        </button>
      </div>

      <section>
        <h3 className="font-semibold mb-3">Instances</h3>
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase text-white/50">
              <tr>
                <th className="px-5 py-3">Instance</th>
                <th className="px-5 py-3">Host</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {instances.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">No instances</td></tr>
              ) : instances.map((instance) => (
                <tr key={instance.id} className="hover:bg-white/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <IconServer size={18} className="text-accent-primary" />
                      <div>
                        <div className="font-medium">{instance.configurationName}</div>
                        <div className="text-xs text-white/40">#{instance.id} · {instance.gameKey.toUpperCase()}</div>
                        {instance.lastError && <div className="text-xs text-red-300 max-w-xs truncate">{instance.lastError}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">{instance.hostName}</td>
                  <td className="px-5 py-4 font-mono text-sm text-white/70">{instance.connectAddress || '-'}</td>
                  <td className="px-5 py-4"><StatusBadge status={instance.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <ActionButton title="Start" onClick={() => action(instance, 'start')}><IconPlayerPlay size={15} /></ActionButton>
                      <ActionButton title="Stop" onClick={() => action(instance, 'stop')}><IconX size={15} /></ActionButton>
                      <ActionButton title="Restart" onClick={() => action(instance, 'restart')}><IconRotateClockwise size={15} /></ActionButton>
                      <ActionButton title="Retry" onClick={() => action(instance, 'retry')}><IconRefresh size={15} /></ActionButton>
                      <ActionButton title="Delete" danger onClick={() => action(instance, 'delete')}><IconTrash size={15} /></ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Recent Deployments</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {deployments.length === 0 ? (
            <div className="bg-white/5 rounded-2xl border border-white/5 p-6 text-white/50">No deployments</div>
          ) : deployments.slice(0, 6).map((deployment) => (
            <div key={deployment.id} className="bg-white/5 rounded-2xl border border-white/5 p-4">
              <div className="flex justify-between gap-4 mb-2">
                <div className="font-medium">{deployment.name}</div>
                <StatusBadge status={deployment.status} />
              </div>
              <div className="text-sm text-white/50">
                {deployment.succeededCount}/{deployment.totalCount} online · {deployment.failedCount} failed · {deployment.queuedCount} queued
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SelectionPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {hasChildren ? children : <div className="text-white/50 text-sm py-4">{empty}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'online' || status === 'completed'
    ? 'bg-green-500/20 text-green-300'
    : status.includes('failed') || status === 'failed'
      ? 'bg-red-500/20 text-red-300'
      : 'bg-yellow-500/20 text-yellow-300';
  return <span className={`px-2 py-1 rounded-full text-xs capitalize ${color}`}>{status.replaceAll('_', ' ')}</span>;
}

function ActionButton({ title, onClick, children, danger = false }: { title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick} className={`p-2 rounded-lg ${danger ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:text-white'}`}>
      {children}
    </button>
  );
}
