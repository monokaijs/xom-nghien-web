"use client";

import React, { useEffect, useRef, useState } from 'react';
import { IconSend, IconTerminal } from '@tabler/icons-react';
import Select from '@/components/ui/Select';

interface Instance {
  id: number;
  name: string;
  status: string;
  connectAddress: string | null;
  configurationName: string;
  hostName: string;
}

interface LogEntry {
  type: 'command' | 'response' | 'error';
  text: string;
  timestamp: Date;
}

interface ServerEvent {
  id: number;
  type: string;
  level: string;
  message: string;
  created_at: string;
}

export default function RconConsolePage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [executing, setExecuting] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const seenEventIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/admin/game-server-instances')
      .then((response) => response.json())
      .then((data) => {
        const online = (data.instances || []).filter((instance: Instance) => instance.status === 'online');
        setInstances(online);
        if (online[0]) setSelectedId(String(online[0].id));
      });
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    seenEventIds.current = new Set();
    if (!selectedId) return;

    const fetchEvents = async () => {
      const response = await fetch(`/api/admin/game-server-instances/${selectedId}/events`);
      const data = await response.json();
      const events: ServerEvent[] = (data.events || []).slice().reverse();
      for (const event of events) {
        if (seenEventIds.current.has(event.id)) continue;
        seenEventIds.current.add(event.id);
        if (event.type === 'rcon_response') {
          addLog('response', event.message);
        }
        if (event.type === 'rcon_error') {
          addLog('error', event.message);
        }
      }
    };

    void fetchEvents();
    const interval = setInterval(fetchEvents, 2500);
    return () => clearInterval(interval);
  }, [selectedId]);

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs((current) => [...current, { type, text, timestamp: new Date() }]);
  };

  const execute = async () => {
    const cmd = command.trim();
    if (!cmd || !selectedId || executing) return;
    setCommand('');
    setExecuting(true);
    addLog('command', `> ${cmd}`);
    try {
      const response = await fetch(`/api/admin/game-server-instances/${selectedId}/rcon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await response.json();
      if (data.success) {
        addLog('response', `Queued command job ${data.job?.bullmqJobId || data.job?.dbJobId || ''}`.trim());
      } else {
        addLog('error', data.error || 'Command failed');
      }
    } catch (error: any) {
      addLog('error', error.message || 'Network error');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-5">
      <div>
        <h2 className="text-2xl font-bold mb-2">RCON Console</h2>
        <p className="text-white/60 text-sm">Execute commands against deployed game server instances.</p>
      </div>

      <Select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={instances.length === 0}
        options={instances.length === 0 ? [{ value: '', label: 'No online instances' }] : instances.map((instance) => ({
          value: String(instance.id),
          label: `${instance.configurationName} @ ${instance.hostName} (${instance.connectAddress || 'pending'})`,
        }))}
      />

      <div className="bg-card-bg rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <IconTerminal className="text-accent-primary" size={20} />
          <span className="font-medium">Console Output</span>
          <button onClick={() => setLogs([])} className="ml-auto text-sm text-white/60 hover:text-white">Clear</button>
        </div>
        <div ref={logRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 min-h-[360px]">
          {logs.length === 0 ? (
            <div className="text-white/40 text-center py-8">No commands executed yet.</div>
          ) : logs.map((log, index) => (
            <div key={index} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'command' ? 'text-blue-400' : 'text-green-400'} whitespace-pre-wrap`}>
              <span className="text-white/40 mr-2">[{log.timestamp.toLocaleTimeString()}]</span>{log.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5 flex gap-3">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') execute(); }}
            disabled={!selectedId || executing}
            placeholder="Enter RCON command..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 font-mono"
          />
          <button onClick={execute} disabled={!command.trim() || !selectedId || executing} className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2">
            <IconSend size={18} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
