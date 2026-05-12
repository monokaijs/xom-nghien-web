"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IconArrowLeft, IconRefresh, IconServer } from '@tabler/icons-react';

type DetailTab = 'overview' | 'deployment' | 'events' | 'logs' | 'live';

interface Host {
  id: number;
  name: string;
  publicAddress: string;
  sshHost: string;
  sshPort: number;
  baseDeployPath: string;
  portRangeStart: number;
  portRangeEnd: number;
  maxInstances: number;
  enabled: number;
  healthStatus: string;
}

interface Instance {
  id: number;
  deploymentId: number | null;
  hostId: number;
  configurationId: number;
  configurationVersionId: number;
  gameKey: string;
  name: string;
  status: string;
  desiredState: string;
  visibility: string;
  dockerProjectName: string;
  containerName: string;
  connectAddress: string | null;
  queryPort: number | null;
  ports: Array<{ name: string; hostPort: number; containerPort: number; protocol: string }>;
  configSnapshot: Record<string, any>;
  lastError: string | null;
  provisionedAt: string | null;
  created_at: string;
  updated_at: string;
  host: Host;
  configurationName: string;
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
  updated_at: string;
}

interface Job {
  id: number;
  type: string;
  status: string;
  attempts: number;
  error: string | null;
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

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'events', label: 'Events' },
  { key: 'logs', label: 'Log Tail' },
  { key: 'live', label: 'Live Log' },
];

export default function Cs2ServerDetailPage() {
  const params = useParams<{ instanceId: string }>();
  const instanceId = params.instanceId;
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [instance, setInstance] = useState<Instance | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/game-server-instances/${instanceId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load server');
      setInstance(data.instance);
      setDeployment(data.deployment || null);
      setJobs(data.jobs || []);
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
    const interval = setInterval(fetchDetail, 15000);
    return () => clearInterval(interval);
  }, [instanceId]);

  const configSummary = useMemo(() => {
    if (!instance) return [];
    const config = instance.configSnapshot || {};
    return [
      ['Mode', config.modeLabel || config.mode || '-'],
      ['Map', config.map || '-'],
      ['Max Players', String(config.maxPlayers || '-')],
      ['Tickrate', String(config.tickRate || '-')],
    ];
  }, [instance]);

  if (loading && !instance) {
    return <div className="text-white/50">Loading CS2 server...</div>;
  }

  if (error || !instance) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/cs2-servers" className="text-white/60 hover:text-white inline-flex items-center gap-2">
          <IconArrowLeft size={18} /> Back to CS2 Servers
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-5">{error || 'Server not found'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/admin/cs2-servers" className="text-white/50 hover:text-white inline-flex items-center gap-2 text-sm mb-3">
            <IconArrowLeft size={16} /> CS2 Servers
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center">
              <IconServer size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{instance.configurationName}</h2>
              <p className="text-sm text-white/50">#{instance.id} · {instance.host.name} · {instance.connectAddress || 'pending address'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={instance.status} />
          <button onClick={fetchDetail} className="bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2 flex items-center gap-2">
            <IconRefresh size={18} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {detailTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === tab.key ? 'bg-accent-primary text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <InfoPanel title="Server">
            <Info label="Status" value={instance.status.replaceAll('_', ' ')} />
            <Info label="Desired State" value={instance.desiredState} />
            <Info label="Container" value={instance.containerName} mono />
            <Info label="Project" value={instance.dockerProjectName} mono />
            <Info label="Provisioned" value={instance.provisionedAt ? new Date(instance.provisionedAt).toLocaleString() : '-'} />
          </InfoPanel>
          <InfoPanel title="Host">
            <Info label="Name" value={instance.host.name} />
            <Info label="Public Address" value={instance.host.publicAddress} mono />
            <Info label="SSH" value={`${instance.host.sshHost}:${instance.host.sshPort}`} mono />
            <Info label="Health" value={instance.host.healthStatus} />
            <Info label="Deploy Path" value={instance.host.baseDeployPath} mono />
          </InfoPanel>
          <InfoPanel title="Configuration">
            {configSummary.map(([label, value]) => <Info key={label} label={label} value={value} />)}
            <Info label="Version" value={`#${instance.configurationVersionId}`} />
            <Info label="Visibility" value={instance.visibility} />
          </InfoPanel>
          <div className="xl:col-span-3">
            <InfoPanel title="Ports">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {instance.ports.length === 0 ? (
                  <div className="text-white/50 text-sm">No ports allocated</div>
                ) : instance.ports.map((port, index) => (
                  <div key={`${port.name}-${port.protocol}-${index}`} className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-white/40 mb-1">{port.name} / {port.protocol}</div>
                    <div className="font-mono">{port.hostPort} → {port.containerPort}</div>
                  </div>
                ))}
              </div>
            </InfoPanel>
          </div>
          {instance.lastError && (
            <div className="xl:col-span-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 text-sm">
              {instance.lastError}
            </div>
          )}
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <InfoPanel title="Recent Deployment">
            {deployment ? (
              <>
                <Info label="Name" value={deployment.name} />
                <Info label="Status" value={deployment.status.replaceAll('_', ' ')} />
                <Info label="Progress" value={`${deployment.succeededCount}/${deployment.totalCount} online · ${deployment.failedCount} failed · ${deployment.queuedCount} queued`} />
                <Info label="Created" value={new Date(deployment.created_at).toLocaleString()} />
              </>
            ) : (
              <div className="text-white/50 text-sm">No deployment linked to this server.</div>
            )}
          </InfoPanel>
          <InfoPanel title="Jobs">
            <Timeline items={jobs.map((job) => ({
              id: job.id,
              title: `${job.type} · ${job.status}`,
              body: job.error || `attempts: ${job.attempts}`,
              level: job.status === 'failed' ? 'error' : 'info',
              created_at: job.created_at,
            }))} empty="No jobs recorded" />
          </InfoPanel>
        </div>
      )}

      {activeTab === 'events' && (
        <InfoPanel title="Event Log">
          <Timeline items={events.map((event) => ({
            id: event.id,
            title: `${event.type} · ${event.level}`,
            body: event.message,
            level: event.level,
            created_at: event.created_at,
          }))} empty="No events recorded" />
        </InfoPanel>
      )}

      {activeTab === 'logs' && <ServerLogs instanceId={instance.id} live={false} />}
      {activeTab === 'live' && <ServerLogs instanceId={instance.id} live />}
    </div>
  );
}

function ServerLogs({ instanceId, live }: { instanceId: number; live: boolean }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/game-server-instances/${instanceId}/logs?tail=300`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch logs');
      setLogs(data.logs || []);
      setFetchedAt(data.fetchedAt || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchLogs();
    if (!live) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [instanceId, live]);

  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">{live ? 'Live Log' : 'Log Tail'}</h3>
          <p className="text-xs text-white/40">{fetchedAt ? `Fetched ${new Date(fetchedAt).toLocaleTimeString()}` : 'Docker logs tail'}</p>
        </div>
        <button onClick={fetchLogs} className="bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
          <IconRefresh size={16} /> Refresh
        </button>
      </div>
      <div className="bg-black/25 p-4 font-mono text-xs min-h-[420px] max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="text-white/50">Loading logs...</div>
        ) : error ? (
          <div className="text-red-300 whitespace-pre-wrap">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-white/40">No log lines returned.</div>
        ) : logs.map((line, index) => (
          <div key={`${index}-${line}`} className="text-white/75 whitespace-pre-wrap leading-relaxed">{line}</div>
        ))}
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/5 border border-white/5 rounded-2xl p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={`${mono ? 'font-mono' : ''} text-sm break-words`}>{value || '-'}</div>
    </div>
  );
}

function Timeline({
  items,
  empty,
}: {
  items: Array<{ id: number; title: string; body: string; level: string; created_at: string }>;
  empty: string;
}) {
  if (items.length === 0) return <div className="text-white/50 text-sm">{empty}</div>;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="border-l border-white/10 pl-3">
          <div className={`text-sm font-medium ${item.level === 'error' ? 'text-red-300' : 'text-white'}`}>{item.title}</div>
          <div className="text-sm text-white/60 whitespace-pre-wrap">{item.body}</div>
          <div className="text-xs text-white/35 mt-1">{new Date(item.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
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
