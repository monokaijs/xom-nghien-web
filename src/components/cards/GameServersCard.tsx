"use client";

import React, {useEffect, useState} from 'react';
import {IconPlayerPlayFilled} from '@tabler/icons-react';
import {ServerStatus} from '@/types/server';
import {connectToServer} from '@/lib/connectToServer';

interface GameServersCardProps {
  title?: string;
  seeAllLink?: string;
}

export default function GameServersCard({title = "Máy Chủ Game", seeAllLink = "#"}: GameServersCardProps) {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        setServers(data.servers || []);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
        setServers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (online: boolean) => {
    if (!online) return 'border-red-500/30 bg-red-500/20 text-red-300';
    return 'border-green-500/30 bg-green-500/20 text-green-300';
  };

  const getStatusText = (online: boolean) => {
    return online ? 'Hoạt Động' : 'Offline';
  };

  return (
    <>
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
          {loading ? (
            Array.from({length: 3}).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-[25px] min-w-[350px] w-[350px] aspect-video relative overflow-hidden bg-[#333] flex-shrink-0 animate-pulse"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
              </div>
            ))
          ) : servers.length > 0 ? (
            servers.map((server) => (
              <div
                key={server.id}
                className="rounded-[25px] min-w-[350px] w-[350px] bg-cover bg-center aspect-video relative overflow-hidden bg-[#333] group flex-shrink-0 cursor-pointer transition-transform duration-300"
                style={{
                  backgroundImage: `url(https://www.mapban.gg/images/maps/cs2/${server.map}.jpg), url(https://images.gamebanana.com/img/ss/mods/647fce8887e89.jpg)`,
                }}
                onClick={() => server.online && connectToServer(server.ip, server.port)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
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
                        {server.ping}ms
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
                          connectToServer(server.ip, server.port);
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
