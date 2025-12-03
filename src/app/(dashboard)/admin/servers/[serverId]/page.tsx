"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconTerminal, IconSend, IconArrowLeft, IconServer } from '@tabler/icons-react';
import Select from '@/components/ui/Select';

interface Server {
  id: number;
  name: string;
  game: string;
  address: string;
  description: string | null;
  rcon_password: string | null;
}

interface LogEntry {
  type: 'command' | 'response' | 'error' | 'info';
  text: string;
  timestamp: Date;
}

export default function ServerManagementPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [demoFileName, setDemoFileName] = useState('');
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [matchUrl, setMatchUrl] = useState('');
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [mapName, setMapName] = useState('');
  const [showMapDialog, setShowMapDialog] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServer();
  }, [serverId]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchServer = async () => {
    try {
      const response = await fetch(`/api/admin/servers/${serverId}`);
      if (response.ok) {
        const data = await response.json();
        setServer(data.server);
      } else {
        addLog('error', 'Failed to fetch server details');
      }
    } catch (error) {
      addLog('error', 'Failed to fetch server details');
    } finally {
      setLoading(false);
    }
  };

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const executeRconCommand = async (cmd: string) => {
    if (!server || !server.rcon_password || isExecuting) return;

    setIsExecuting(true);
    addLog('command', `> ${cmd}`);

    try {
      const response = await fetch('/api/admin/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: serverId,
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
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    const cmd = command.trim();
    setCommandHistory(prev => {
      const newHistory = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 50);
      return newHistory;
    });
    setHistoryIndex(-1);
    setCommand('');

    await executeRconCommand(cmd);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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

  const handleQuickCommand = (cmd: string) => {
    executeRconCommand(cmd);
  };

  const handleChangeMode = (mode: string) => {
    executeRconCommand(`css_mode ${mode}`);
  };

  const handleStartDemo = () => {
    if (!demoFileName.trim()) return;
    executeRconCommand(`tv_record demos/${demoFileName}`);
    setShowDemoDialog(false);
    setDemoFileName('');
  };

  const handleLoadMatch = () => {
    if (!matchUrl.trim()) return;
    executeRconCommand(`matchzy_loadmatch_url ${matchUrl}`);
    setShowMatchDialog(false);
    setMatchUrl('');
  };

  const handleChangeMap = () => {
    if (!mapName.trim()) return;
    executeRconCommand(`changelevel ${mapName}`);
    setShowMapDialog(false);
    setMapName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60">Đang tải...</div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          Server không tồn tại
        </div>
      </div>
    );
  }

  if (!server.rcon_password) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/admin/servers')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit"
        >
          <IconArrowLeft size={20} />
          Quay lại
        </button>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-500">
          Server này chưa được cấu hình RCON password
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/servers')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <IconArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">{server.name}</h2>
          <p className="text-white/60 text-sm">
            {server.game} - {server.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <h3 className="font-medium mb-3 text-sm text-white/60">Chế Độ Game</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleChangeMode('deathmatch')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed"
            >
              Deathmatch
            </button>
            <button
              onClick={() => handleChangeMode('competitive')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed"
            >
              Competitive
            </button>
            <button
              onClick={() => handleChangeMode('gg')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed"
            >
              Gun Game
            </button>
            <button
              onClick={() => handleChangeMode('casual')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed"
            >
              Casual
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <h3 className="font-medium mb-3 text-sm text-white/60">Server Controls</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleQuickCommand('css_reset')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed text-left"
            >
              Reset Server
            </button>
            <button
              onClick={() => setShowMatchDialog(true)}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed text-left"
            >
              Load Match
            </button>
            <button
              onClick={() => setShowMapDialog(true)}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed text-left"
            >
              Change Map
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <h3 className="font-medium mb-3 text-sm text-white/60">Demo Recording</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowDemoDialog(true)}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed text-left"
            >
              Start Recording
            </button>
            <button
              onClick={() => handleQuickCommand('tv_stoprecord')}
              disabled={isExecuting}
              className="bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed text-left"
            >
              Stop Recording
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card-bg rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <IconTerminal className="text-accent-primary" size={20} />
          <span className="font-medium">RCON Console</span>
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
              No commands executed yet. Use quick actions above or type a command below.
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
                disabled={isExecuting}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 transition-colors font-mono"
              />
            </div>
            <button
              onClick={executeCommand}
              disabled={!command.trim() || isExecuting}
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

      {showDemoDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDemoDialog(false)}>
          <div className="bg-bg-panel rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Start Demo Recording</h3>
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Demo File Name</label>
              <input
                type="text"
                value={demoFileName}
                onChange={(e) => setDemoFileName(e.target.value)}
                placeholder="match_2024_01_01"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartDemo();
                  }
                }}
              />
              <p className="text-xs text-white/40 mt-2">File will be saved as: demos/{demoFileName}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDemoDialog(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDemo}
                disabled={!demoFileName.trim()}
                className="flex-1 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Start Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {showMatchDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMatchDialog(false)}>
          <div className="bg-bg-panel rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Load Match</h3>
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Tournament MatchZy URL</label>
              <input
                type="text"
                value={matchUrl}
                onChange={(e) => setMatchUrl(e.target.value)}
                placeholder="https://example.com/tournament/match.json"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadMatch();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMatchDialog(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadMatch}
                disabled={!matchUrl.trim()}
                className="flex-1 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Load Match
              </button>
            </div>
          </div>
        </div>
      )}

      {showMapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMapDialog(false)}>
          <div className="bg-bg-panel rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Change Map</h3>
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Map Name</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="de_dust2"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleChangeMap();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMapDialog(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeMap}
                disabled={!mapName.trim()}
                className="flex-1 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Change Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
