"use client";

import {ClockIcon, PlayIcon, UsersIcon, WifiOffIcon} from "lucide-react";
import {ServerStatus} from "@/types/server";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {connectToServer} from "@/lib/connect";

interface GameServerCardProps {
  server?: ServerStatus;
}

export default function GameServerCard({server}: GameServerCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleConnect = () => {
    if (server) {
      connectToServer(server.ip, server.port, password);
      setIsModalOpen(false);
      setPassword('');
    }
  };

  if (!server) {
    return (
      <div className="rounded-3xl p-6 bg-slate-800/50 relative z-0 overflow-hidden animate-pulse">
        <div className="absolute z-10 left-0 right-0 top-0 bottom-0 w-full h-full inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-slate-700/20 to-slate-900/60"></div>
        </div>
        <div className="z-20 relative">
          <div className="h-6 bg-slate-600/50 rounded mb-2 w-3/4"></div>
          <div className="flex -ml-2.5 text-sm flex-row items-start gap-2 mb-2">
            <div className="h-6 bg-slate-600/50 rounded-full w-24"></div>
            <div className="h-6 bg-slate-600/50 rounded-full w-20"></div>
          </div>
          <div className="h-5 bg-slate-600/50 rounded mb-1 w-16"></div>
          <div className="h-8 bg-slate-600/50 rounded mb-4 w-20"></div>
          <div className="h-8 bg-slate-600/50 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!server.online) return 'bg-red-500/20 border-red-500/30 text-red-300';
    return 'bg-green-500/20 border-green-500/30 text-green-300';
  };

  const getStatusText = () => {
    if (!server.online) return 'Offline';
    return 'Online';
  };

  return (
    <div
      className="rounded-3xl p-6 bg-cover bg-center relative z-0 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundImage: `url(https://www.mapban.gg/images/maps/cs2/${server.map}.jpg), url(https://images.gamebanana.com/img/ss/mods/647fce8887e89.jpg)`,
      }}
    >
      <div className="absolute z-10 left-0 right-0 top-0 bottom-0 w-full h-full inset-0 pointer-events-none">
        <div className="w-full h-full bg-radial from-transparent to-black/80 bg-black/40"></div>
      </div>
      <div className="z-20 relative">
        {/* Server Name and Status */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-medium text-white flex-1">{server.name}</h3>
          <div className={`backdrop-blur-xl px-2.5 py-1 border rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>

        {/* Server Info Tags */}
        <div className="flex -ml-2.5 text-sm flex-row items-start gap-2 flex-wrap">
          <div className="backdrop-blur-xl px-2.5 py-1 border border-white/5 rounded-full text-white/80">
            {server.ip}:{server.port}
          </div>
          {server.map && (
            <div className="backdrop-blur-xl px-2.5 py-1 border border-white/5 rounded-full text-white/80">
              {server.map}
            </div>
          )}
          {/*{server.ping && (*/}
          {/*  <div*/}
          {/*    className="backdrop-blur-xl px-2.5 py-1 border border-white/5 rounded-full text-white/80 flex items-center gap-1">*/}
          {/*    <ClockIcon className="w-3 h-3"/>*/}
          {/*    {server.ping}ms*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>

        {/* Player Count */}
        <div className="mt-3">
          <div className="text-lg text-white/90 flex items-center gap-1">
            <UsersIcon className="w-4 h-4"/>
            Players:
          </div>
          <div className="text-3xl font-bold text-white">
            {server.online ? `${server.players.current} / ${server.players.max}` : '-- / --'}
          </div>
        </div>

        {/* Connect Button or Error */}
        <div className="mt-4">
          {server.online ? (
            <button
              className="bg-white hover:bg-red-500 hover:text-white transition-all duration-200 text-black flex flex-row items-center gap-1 text-sm px-3 py-2 rounded-lg font-medium"
              onClick={() => setIsModalOpen(true)}
            >
              <PlayIcon className="w-4 h-4"/> Connect
            </button>
          ) : (
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <WifiOffIcon className="w-4 h-4"/>
              <span>{server.error || 'Server unavailable'}</span>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="mt-2 text-xs text-white/50">
          Updated: {new Date(server.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Password Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-white">Connect to Server</DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter the server password (leave blank if no password required)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-300 block mb-2">
                Server Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-neutral-700 text-white placeholder-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConnect();
                  }
                }}
              />
            </div>
            <div className="text-xs text-slate-400">
              Server: {server.name} ({server.ip}:{server.port})
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setPassword('');
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <PlayIcon className="w-4 h-4 mr-2"/>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
