"use client";

import React, {useEffect, useState} from 'react';
import {IconPlayerPlayFilled, IconX} from '@tabler/icons-react';
import {ServerStatus} from '@/types/server';
import {connectToServer} from '@/lib/connectToServer';
import {getMapImage} from "@/lib/utils/mapImage";

interface GameServersCardProps {
  title?: string;
  seeAllLink?: string;
  initialServers?: ServerStatus[];
}

export default function GameServersCard({title = "Máy Chủ Game", seeAllLink = "#", initialServers = []}: GameServersCardProps) {
  const [servers, setServers] = useState<ServerStatus[]>(initialServers);
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(null);

  const getStatusColor = (online: boolean) => {
    if (!online) return 'border-red-500/30 bg-red-500/20 text-red-300';
    return 'border-green-500/30 bg-green-500/20 text-green-300';
  };

  const getStatusText = (online: boolean) => {
    return online ? 'Hoạt Động' : 'Offline';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {selectedServer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedServer(null)}>
          <div className="bg-bg-sidebar rounded-[30px] max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 bg-cover bg-center" style={{
              backgroundImage: `url(${getMapImage(selectedServer.map)}), url(https://images.gamebanana.com/img/ss/mods/647fce8887e89.jpg)`
            }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              <button
                onClick={() => setSelectedServer(null)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <IconX size={20} />
              </button>
              <div className="absolute bottom-5 left-5 right-5">
                <h2 className="text-3xl font-bold mb-2">{selectedServer.name}</h2>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className={`backdrop-blur-xl px-3 py-1.5 border rounded-full text-sm font-medium ${getStatusColor(selectedServer.online)}`}>
                    {getStatusText(selectedServer.online)}
                  </div>
                  <div className="backdrop-blur-xl px-3 py-1.5 border border-white/10 rounded-full text-sm">
                    {selectedServer.ip}:{selectedServer.port}
                  </div>
                  {selectedServer.map && (
                    <div className="backdrop-blur-xl px-3 py-1.5 border border-white/10 rounded-full text-sm">
                      {selectedServer.map}
                    </div>
                  )}
                  {selectedServer.ping !== undefined && (
                    <div className="backdrop-blur-xl px-3 py-1.5 border border-white/10 rounded-full text-sm">
                      5ms
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-16rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Người Chơi ({selectedServer.players.current}/{selectedServer.players.max})
                </h3>
                <button
                  onClick={() => {
                    connectToServer(selectedServer.ip, selectedServer.port);
                    setSelectedServer(null);
                  }}
                  disabled={!selectedServer.online}
                  className="bg-accent-primary px-6 py-2.5 rounded-full text-white font-medium flex items-center gap-2 hover:bg-[#ff6b76] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconPlayerPlayFilled size={18} />
                  Tham Gia
                </button>
              </div>

              {selectedServer.players.list && selectedServer.players.list.length > 0 ? (
                <div className="space-y-2">
                  {selectedServer.players.list.map((player, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <div className="flex gap-6 text-sm">
                        {player.raw?.score !== undefined && (
                          <div className="text-center">
                            <div className="text-white/50 text-xs mb-1">Điểm</div>
                            <div className="font-semibold">{player.raw.score}</div>
                          </div>
                        )}
                        {player.raw?.time !== undefined && (
                          <div className="text-center">
                            <div className="text-white/50 text-xs mb-1">Thời Gian</div>
                            <div className="font-semibold">{formatTime(player.raw.time)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-white/50">
                  Không có người chơi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center -mb-2.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <a href={seeAllLink} className="text-text-secondary no-underline text-sm hover:text-white transition-colors">Xem Thêm</a>
      </div>
      <div className="relative">
        <div
          className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide relative z-0"
          onScroll={(e) => {
            const target = e.currentTarget;
            const fadeElement = target.parentElement?.querySelector('.fade-gradient') as HTMLElement;
            if (fadeElement) {
              const isScrolledToEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 10;
              fadeElement.style.opacity = isScrolledToEnd ? '0' : '1';
            }
          }}
        >
          {servers.length > 0 ? (
            servers.map((server) => (
              <div
                key={server.id}
                className="group rounded-[25px] min-w-[350px] w-[350px] bg-cover bg-center aspect-video relative overflow-hidden bg-[#333] group flex-shrink-0 cursor-pointer transition-transform duration-300"
                style={{
                  backgroundImage: `url(${getMapImage(server.map)}), url(https://images.gamebanana.com/img/ss/mods/647fce8887e89.jpg)`,
                }}
                onClick={() => server.online && setSelectedServer(server)}
              >
                <div className="absolute inset-0 transition-all duration-300 bg-bg-dark/60 group-hover:bg-bg-dark/40 to-transparent z-10"></div>
                <div className="absolute top-5 left-5 right-5 z-20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-semibold flex-1">{server.name}</h4>
                    <div
                      className={`backdrop-blur-xl px-2.5 py-1 border rounded-full text-xs font-medium ${getStatusColor(server.online)}`}>
                      {getStatusText(server.online)}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3 text-xs flex-wrap">
                    <div className="backdrop-blur-xl px-2.5 py-1 border border-white/10 rounded-full text-white/80">
                      {server.ip}:{server.port}
                    </div>
                    {server.map && (
                      <div className="backdrop-blur-xl px-2.5 py-1 border border-white/10 rounded-full text-white/80">
                        {server.map}
                      </div>
                    )}
                    {server.ping !== undefined && (
                      <div className="backdrop-blur-xl px-2.5 py-1 border border-white/10 rounded-full text-white/80">
                        5ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 z-20">

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/70 mb-1">Người Chơi</div>
                      <div className="text-xl font-bold">
                        {server.online ? `${server.players.current} / ${server.players.max}` : '-- / --'}
                      </div>
                    </div>
                    <button
                      className="w-10 h-10 rounded-full bg-accent-primary text-white flex items-center justify-center hover:bg-[#ff6b76] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!server.online}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (server.online) {
                          setSelectedServer(server);
                        }
                      }}
                    >
                      <IconPlayerPlayFilled size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-white/50 text-center py-10">Không có máy chủ</div>
          )}
        </div>
        <div
          className="fade-gradient absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-dark to-transparent pointer-events-none transition-opacity duration-300 z-10"
          style={{opacity: 1}}
        ></div>
      </div>
    </>
  );
}
