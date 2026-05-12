"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IconExternalLink,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconRotateClockwise,
  IconSearch,
  IconSend,
  IconServer,
  IconTerminal2,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import GameConfigurationsPage from '../game-configurations/page';
import ServerHostsPage from '../server-hosts/page';
import GameCredentialsPage from '../game-credentials/page';

type TabKey = 'servers' | 'deployments' | 'configurations' | 'hosts' | 'credentials';

interface Config {
  id: number;
  name: string;
  isActive: number;
  currentVersion: { versionNumber: number; config?: Record<string, any> } | null;
}

interface Host {
  id: number;
  name: string;
  publicAddress: string;
  portRangeStart: number;
  portRangeEnd: number;
  maxInstances: number;
  enabled: number;
  healthStatus: string;
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
  deploymentId: number | null;
  hostId: number;
  configurationId: number;
  name: string;
  gameKey: string;
  status: string;
  desiredState: string;
  connectAddress: string | null;
  hostName: string;
  hostPublicAddress: string;
  configurationName: string;
  lastError: string | null;
  created_at: string;
  updated_at: string;
}

interface ServerEvent {
  id: number;
  type: string;
  level: string;
  message: string;
  created_at: string;
}

interface LogEntry {
  type: 'command' | 'response' | 'error';
  text: string;
  timestamp: Date;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'servers', label: 'Servers' },
  { key: 'deployments', label: 'Deployments' },
  { key: 'configurations', label: 'Configurations' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'credentials', label: 'Credentials' },
];

export default function Cs2ServersPage() {
  return (
    <Suspense fallback={<div className="text-white/50">Loading CS2 servers...</div>}>
      <Cs2ServersContent />
    </Suspense>
  );
}

function Cs2ServersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabKey | null;
  const activeTab = tabs.some((tab) => tab.key === requestedTab) ? requestedTab! : 'servers';

  const setTab = (tab: TabKey) => {
    router.replace(tab === 'servers' ? '/admin/cs2-servers' : `/admin/cs2-servers?tab=${tab}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">CS2 Servers</h2>
          <p className="text-white/50 text-sm">Manage CS2 deployments, hosts, server config, credentials, logs, and RCON.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === tab.key ? 'bg-accent-primary text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'servers' && <ServersTab />}
      {activeTab === 'deployments' && <DeploymentsTab />}
      {activeTab === 'configurations' && <GameConfigurationsPage />}
      {activeTab === 'hosts' && <ServerHostsPage />}
      {activeTab === 'credentials' && <GameCredentialsPage />}
    </div>
  );
}

function ServersTab() {
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [rconInstance, setRconInstance] = useState<Instance | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const params = new URLSearchParams({ gameKey: 'cs2' });
    if (search) params.set('search', search);

    const [instancesRes, configsRes, hostsRes] = await Promise.all([
      fetch(`/api/admin/game-server-instances?${params}`),
      fetch('/api/admin/game-configurations?gameKey=cs2'),
      fetch('/api/admin/server-hosts'),
    ]);
    const [instancesData, configsData, hostsData] = await Promise.all([
      instancesRes.json(),
      configsRes.json(),
      hostsRes.json(),
    ]);

    setInstances(instancesData.instances || []);
    setConfigs((configsData.configurations || []).filter((config: Config) => config.isActive));
    setHosts((hostsData.hosts || []).filter((host: Host) => host.enabled));
    setLoading(false);
  };

  useEffect(() => {
    void fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [search]);

  const action = async (instance: Instance, actionName: string) => {
    if (actionName === 'delete' && !confirm(`Delete ${instance.configurationName} on ${instance.hostName}?`)) return;
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="bg-white/5 rounded-xl flex items-center px-4 py-2.5 border border-white/5 flex-1">
          <IconSearch size={18} className="text-white/40 mr-3" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search CS2 servers..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2 flex items-center gap-2">
            <IconRefresh size={18} /> Refresh
          </button>
          <button onClick={() => setShowDeploy(true)} className="bg-accent-primary hover:bg-accent-primary/80 rounded-lg px-4 py-2 flex items-center gap-2">
            <IconPlus size={18} /> Deploy
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-5 py-3">Server</th>
              <th className="px-5 py-3">Host</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">Loading...</td></tr>
            ) : instances.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-white/50">No CS2 servers deployed</td></tr>
            ) : instances.map((instance) => (
              <tr key={instance.id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <IconServer size={18} className="text-accent-primary" />
                    <div className="min-w-0">
                      <Link href={`/admin/cs2-servers/${instance.id}`} className="font-medium hover:text-accent-primary">
                        {instance.configurationName}
                      </Link>
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
                    <ActionButton title="Open details" asLink href={`/admin/cs2-servers/${instance.id}`}><IconExternalLink size={15} /></ActionButton>
                    <ActionButton title="RCON" disabled={instance.status !== 'online'} onClick={() => setRconInstance(instance)}><IconTerminal2 size={15} /></ActionButton>
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

      {showDeploy && (
        <DeployDialog
          configs={configs}
          hosts={hosts}
          instances={instances}
          onClose={() => setShowDeploy(false)}
          onDeployed={(instanceId) => {
            setShowDeploy(false);
            router.push(`/admin/cs2-servers/${instanceId}`);
          }}
        />
      )}

      {rconInstance && (
        <RconDialog instance={rconInstance} onClose={() => setRconInstance(null)} />
      )}
    </div>
  );
}

function DeployDialog({
  configs,
  hosts,
  instances,
  onClose,
  onDeployed,
}: {
  configs: Config[];
  hosts: Host[];
  instances: Instance[];
  onClose: () => void;
  onDeployed: (instanceId: number) => void;
}) {
  const [configSearch, setConfigSearch] = useState('');
  const [hostSearch, setHostSearch] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(configs[0]?.id || null);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(hosts[0]?.id || null);
  const [deploying, setDeploying] = useState(false);

  const hostUsage = useMemo(() => {
    const usage = new Map<number, number>();
    for (const instance of instances) {
      if (instance.status === 'deleted') continue;
      usage.set(instance.hostId, (usage.get(instance.hostId) || 0) + 1);
    }
    return usage;
  }, [instances]);

  const filteredConfigs = useMemo(() => {
    const query = configSearch.toLowerCase();
    return configs.filter((config) => config.name.toLowerCase().includes(query));
  }, [configs, configSearch]);

  const filteredHosts = useMemo(() => {
    const query = hostSearch.toLowerCase();
    return hosts.filter((host) => `${host.name} ${host.publicAddress} ${host.healthStatus}`.toLowerCase().includes(query));
  }, [hosts, hostSearch]);

  const activeCountForHost = (hostId: number) => hostUsage.get(hostId) || 0;
  const selectedHost = hosts.find((host) => host.id === selectedHostId) || null;
  const selectedHostFull = selectedHost ? activeCountForHost(selectedHost.id) >= selectedHost.maxInstances : false;

  useEffect(() => {
    if (!selectedHost || selectedHostFull) {
      const nextHost = hosts.find((host) => activeCountForHost(host.id) < host.maxInstances);
      setSelectedHostId(nextHost?.id || null);
    }
  }, [hosts, hostUsage, selectedHost, selectedHostFull]);

  const deploy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedConfigId || !selectedHostId || selectedHostFull) return;

    setDeploying(true);
    try {
      const response = await fetch('/api/admin/game-server-deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configurationIds: [selectedConfigId], hostIds: [selectedHostId] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to deploy CS2 server');
      const instanceId = data.instanceIds?.[0];
      if (instanceId) onDeployed(instanceId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <form onSubmit={deploy} className="bg-bg-panel rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold mb-1">Deploy CS2 Server</h3>
            <p className="text-sm text-white/50">Select one active configuration and one enabled Docker host.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/15">
            <IconX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SelectionColumn
            title="Configuration"
            search={configSearch}
            onSearch={setConfigSearch}
            placeholder="Search configurations..."
            empty="No active CS2 configurations"
          >
            {filteredConfigs.map((config) => (
              <label key={config.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer ${selectedConfigId === config.id ? 'bg-accent-primary/15 border-accent-primary/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <span>
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-white/40 ml-2">v{config.currentVersion?.versionNumber || 0}</span>
                </span>
                <input type="radio" name="configuration" checked={selectedConfigId === config.id} onChange={() => setSelectedConfigId(config.id)} />
              </label>
            ))}
          </SelectionColumn>

          <SelectionColumn
            title="Host"
            search={hostSearch}
            onSearch={setHostSearch}
            placeholder="Search hosts..."
            empty="No enabled hosts"
          >
            {filteredHosts.map((host) => {
              const activeCount = activeCountForHost(host.id);
              const full = activeCount >= host.maxInstances;
              return (
                <label key={host.id} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${full ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/5' : selectedHostId === host.id ? 'bg-accent-primary/15 border-accent-primary/50 cursor-pointer' : 'bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer'}`}>
                  <span className="min-w-0">
                    <span className="font-medium">{host.name}</span>
                    <span className="block text-xs text-white/50">{host.publicAddress}</span>
                    <span className="block text-xs text-white/40 mt-1">
                      {host.healthStatus} · {activeCount}/{host.maxInstances} used · ports {host.portRangeStart}-{host.portRangeEnd}
                    </span>
                  </span>
                  <input type="radio" name="host" disabled={full} checked={selectedHostId === host.id} onChange={() => setSelectedHostId(host.id)} />
                </label>
              );
            })}
          </SelectionColumn>
        </div>

        <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-xl p-4 mt-5">
          <div className="text-sm text-white/60">
            Deploying <span className="text-white font-medium">1</span> CS2 server.
          </div>
          <button
            disabled={deploying || !selectedConfigId || !selectedHostId || selectedHostFull}
            className="bg-accent-primary hover:bg-accent-primary/80 disabled:opacity-40 rounded-lg px-5 py-2 text-white"
          >
            {deploying ? 'Queueing...' : 'Deploy Server'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SelectionColumn({
  title,
  search,
  onSearch,
  placeholder,
  empty,
  children,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="bg-black/20 rounded-lg flex items-center px-3 py-2 border border-white/10 mb-3">
        <IconSearch size={16} className="text-white/40 mr-2" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30 text-sm" />
      </div>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {hasChildren ? children : <div className="text-white/50 text-sm py-4">{empty}</div>}
      </div>
    </div>
  );
}

function RconDialog({ instance, onClose }: { instance: Instance; onClose: () => void }) {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [executing, setExecuting] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const seenEventIds = useRef<Set<number>>(new Set());
  const online = instance.status === 'online';

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs((current) => [...current, { type, text, timestamp: new Date() }]);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    seenEventIds.current = new Set();
    const fetchEvents = async () => {
      const response = await fetch(`/api/admin/game-server-instances/${instance.id}/events`);
      const data = await response.json();
      const events: ServerEvent[] = (data.events || []).slice().reverse();
      for (const event of events) {
        if (seenEventIds.current.has(event.id)) continue;
        seenEventIds.current.add(event.id);
        if (event.type === 'rcon_response') addLog('response', event.message);
        if (event.type === 'rcon_error') addLog('error', event.message);
      }
    };

    void fetchEvents();
    const interval = setInterval(fetchEvents, 2500);
    return () => clearInterval(interval);
  }, [instance.id]);

  const execute = async () => {
    const cmd = command.trim();
    if (!cmd || executing || !online) return;
    setCommand('');
    setExecuting(true);
    addLog('command', `> ${cmd}`);
    try {
      const response = await fetch(`/api/admin/game-server-instances/${instance.id}/rcon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        addLog('error', data.error || 'Command failed');
      } else {
        addLog('response', `Queued command job ${data.job?.bullmqJobId || data.job?.dbJobId || ''}`.trim());
      }
    } catch (error: any) {
      addLog('error', error.message || 'Network error');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-panel rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold mb-1">RCON Console</h3>
            <p className="text-sm text-white/50 truncate">{instance.configurationName} @ {instance.hostName} ({instance.connectAddress || 'pending'})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/15">
            <IconX size={18} />
          </button>
        </div>
        <div ref={logRef} className="overflow-y-auto p-4 font-mono text-sm space-y-1 min-h-[360px] bg-black/20">
          {!online && <div className="text-yellow-300 mb-3">RCON is available when the server is online.</div>}
          {logs.length === 0 ? (
            <div className="text-white/40 text-center py-8">No commands executed yet.</div>
          ) : logs.map((log, index) => (
            <div key={index} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'command' ? 'text-blue-400' : 'text-green-400'} whitespace-pre-wrap`}>
              <span className="text-white/40 mr-2">[{log.timestamp.toLocaleTimeString()}]</span>{log.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3">
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') execute(); }}
            disabled={!online || executing}
            placeholder="Enter RCON command..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 font-mono"
          />
          <button onClick={execute} disabled={!command.trim() || !online || executing} className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2">
            <IconSend size={18} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

function DeploymentsTab() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/game-server-deployments');
    const data = await response.json();
    setDeployments(data.deployments || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchDeployments();
    const interval = setInterval(fetchDeployments, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Deployments</h3>
          <p className="text-white/50 text-sm">Recent CS2 server deployment batches.</p>
        </div>
        <button onClick={fetchDeployments} className="bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2 flex items-center gap-2">
          <IconRefresh size={18} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {loading ? (
          <div className="text-white/50">Loading...</div>
        ) : deployments.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/5 p-6 text-white/50">No deployments</div>
        ) : deployments.map((deployment) => (
          <div key={deployment.id} className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex justify-between gap-4 mb-2">
              <div className="font-medium">{deployment.name}</div>
              <StatusBadge status={deployment.status} />
            </div>
            <div className="text-sm text-white/50">
              {deployment.succeededCount}/{deployment.totalCount} online · {deployment.failedCount} failed · {deployment.queuedCount} queued
            </div>
            <div className="text-xs text-white/35 mt-2">{new Date(deployment.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'online' || status === 'completed'
    ? 'bg-green-500/20 text-green-300'
    : status.includes('failed') || status === 'failed'
      ? 'bg-red-500/20 text-red-300'
      : status === 'offline' || status === 'deleted'
        ? 'bg-white/10 text-white/50'
        : 'bg-yellow-500/20 text-yellow-300';
  return <span className={`px-2 py-1 rounded-full text-xs capitalize ${color}`}>{status.replaceAll('_', ' ')}</span>;
}

function ActionButton({
  title,
  onClick,
  children,
  danger = false,
  disabled = false,
  asLink = false,
  href = '',
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  asLink?: boolean;
  href?: string;
}) {
  const className = `p-2 rounded-lg inline-flex ${danger ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:text-white'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`;

  if (asLink) {
    return (
      <Link title={title} href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button title={title} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
