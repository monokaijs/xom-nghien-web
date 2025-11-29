"use client";

import React, { useState, useEffect, useRef } from 'react';
import { IconTerminal, IconSend, IconServer } from '@tabler/icons-react';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';

interface Server {
  id: number;
  name: string;
  game: string;
  address: string;
  rcon_password: string | null;
}

interface LogEntry {
  type: 'command' | 'response' | 'error' | 'info';
  text: string;
  timestamp: Date;
}

export default function RconConsolePage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/admin/servers');
      const data = await response.json();
      const serversWithRcon = data.servers.filter((s: Server) => s.rcon_password);
      setServers(serversWithRcon);
      
      if (serversWithRcon.length > 0 && !selectedServerId) {
        setSelectedServerId(serversWithRcon[0].id.toString());
      }
    } catch (error) {
      addLog('error', 'Failed to fetch servers');
    }
  };

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const executeCommand = async () => {
    if (!command.trim() || !selectedServerId || isExecuting) return;

    const cmd = command.trim();
    setIsExecuting(true);
    addLog('command', `> ${cmd}`);

    setCommandHistory(prev => {
      const newHistory = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 50);
      return newHistory;
    });
    setHistoryIndex(-1);
    setCommand('');

    try {
      const response = await fetch('/api/admin/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServerId,
          command: cmd,
        }),
      });

      const data = await response.json();

      if (data.success) {
        data.responses.forEach((resp: string) => {
          addLog('response', resp);
        });
      } else {
        addLog('error', data.error || 'Command failed');
        if (data.responses) {
          data.responses.forEach((resp: string) => {
            addLog('error', resp);
          });
        }
      }
    } catch (error: any) {
      addLog('error', `Network error: ${error.message}`);
    } finally {
      setIsExecuting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'response': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-yellow-400';
      default: return 'text-white/70';
    }
  };

  const selectedServer = servers.find(s => s.id.toString() === selectedServerId);

  return (
    <div className="flex flex-col h-full gap-5">
      <div>
        <h2 className="text-2xl font-bold mb-2">RCON Console</h2>
        <p className="text-white/60 text-sm">Execute remote console commands on game servers</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-white/60 text-sm mb-2 block">Select Server</label>
          <Select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            size="md"
            disabled={servers.length === 0}
            options={
              servers.length === 0
                ? [{ value: '', label: 'No servers with RCON configured' }]
                : servers.map(server => ({
                    value: server.id.toString(),
                    label: `${server.name} (${server.game}) - ${server.address}`,
                  }))
            }
          />
        </div>
        {selectedServer && (
          <div className="text-sm text-white/60">
            <div className="font-medium text-white">{selectedServer.name}</div>
            <div>{selectedServer.address}</div>
          </div>
        )}
      </div>

      <div className="bg-card-bg rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <IconTerminal className="text-accent-primary" size={20} />
          <span className="font-medium">Console Output</span>
          <button
            onClick={() => setLogs([])}
            className="ml-auto text-sm text-white/60 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
          style={{ minHeight: '400px' }}
        >
          {logs.length === 0 ? (
            <div className="text-white/40 text-center py-8">
              No commands executed yet. Type a command below to get started.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`${getLogColor(log.type)} whitespace-pre-wrap break-words`}>
                <span className="text-white/40 mr-2">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                {log.text}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter RCON command... (Press ↑/↓ for history)"
                disabled={!selectedServerId || isExecuting}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 transition-colors font-mono"
              />
            </div>
            <button
              onClick={executeCommand}
              disabled={!command.trim() || !selectedServerId || isExecuting}
              className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <IconSend size={18} />
                  Send
                </>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-white/40">
            Tip: Use ↑/↓ arrow keys to navigate command history
          </div>
        </div>
      </div>
    </div>
  );
}

