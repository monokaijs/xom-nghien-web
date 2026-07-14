"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { IconBook, IconExternalLink, IconLink, IconMap, IconPlayerPlayFilled, IconServer, IconX } from '@tabler/icons-react';
import { getGame } from '@/config/games';
import type { ServerOnlineStatus, ServerStatus } from '@/types/server';
import { openConnectionLink } from '@/lib/game-servers';
import { getMapImage } from '@/lib/utils/mapImage';

interface GameServersCardProps {
  title?: string;
  initialServers?: ServerStatus[];
  layout?: 'carousel' | 'grid';
}

export default function GameServersCard({
  title = 'Máy Chủ Game',
  initialServers = [],
  layout = 'carousel',
}: GameServersCardProps) {
  return (
    <section id="servers" className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {initialServers.length > 0 && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-text-secondary">
            {initialServers.length}
          </span>
        )}
      </div>

      {initialServers.length === 0 ? (
        <div className="bg-card-bg rounded-[20px] p-8 text-center text-text-secondary">
          <IconServer size={30} className="mx-auto mb-3 opacity-40" />
          Chưa có máy chủ
        </div>
      ) : (
        <div className={layout === 'grid'
          ? 'grid grid-cols-2 gap-4 max-xl:grid-cols-1'
          : 'flex gap-4 overflow-x-auto pb-2 scrollbar-hide'
        }>
          {initialServers.map((server) => (
            <GameServerItem key={server.id} server={server} layout={layout} />
          ))}
        </div>
      )}
    </section>
  );
}

function GameServerItem({ server, layout }: { server: ServerStatus; layout: 'carousel' | 'grid' }) {
  const hasDirect = Boolean(server.connectionLink);
  const hasGuidance = Boolean(server.connectionGuide);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const canOpenDialog = hasDirect || hasGuidance;
  const game = getGame(server.game);
  const showMap = game?.serverCard.showMap ?? false;
  const mapImage = showMap ? getMapImage(server.metadata.map) : '';
  const backgroundImages = [mapImage, game?.serverCard.coverImage, server.gameImage]
    .filter(Boolean)
    .map((image) => `url("${image}")`)
    .join(', ');
  const playerValue = formatPlayerCount(
    server.metadata.status,
    server.metadata.players.online,
    server.metadata.players.total,
    game?.serverCard.playerCount || 'online',
  );
  const actionEnabled = canOpenDialog && server.metadata.status !== 'offline';

  return (
    <article
      className={`${layout === 'grid' ? 'min-w-0 w-full' : 'min-w-[350px] w-[350px]'} group relative aspect-video min-h-[210px] overflow-hidden rounded-[25px] border border-white/5 bg-[#242427] bg-cover bg-center shadow-lg`}
      style={{ backgroundImage: backgroundImages || undefined }}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-bg-dark/80 via-bg-dark/45 to-bg-dark/90 transition-colors duration-300 group-hover:via-bg-dark/30" />

      <div className="absolute inset-x-5 top-5 z-20">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-white drop-shadow-md">
            {server.name}
          </h3>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-xl ${getStatusClass(server.metadata.status)}`}>
            {getStatusText(server.metadata.status)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {showMap && server.metadata.map && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-white/85 backdrop-blur-xl">
              <IconMap size={13} />
              {server.metadata.map}
            </span>
          )}
          {server.metadata.ping !== null && (
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-white/80 backdrop-blur-xl">
              {server.metadata.ping}ms
            </span>
          )}
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5 z-20 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-white/70">Người Chơi</div>
          <div className="text-xl font-bold text-white drop-shadow-md">{playerValue}</div>
        </div>
        <button
          type="button"
          disabled={!actionEnabled}
          onClick={() => setIsConnectOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg transition-colors hover:bg-[#ff6b76] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
          aria-label={canOpenDialog ? `Kết nối ${server.name}` : `${server.name} chưa cấu hình kết nối`}
        >
          <IconPlayerPlayFilled size={16} />
        </button>
      </div>

      {isConnectOpen && (
        <ConnectDialog
          server={server}
          onClose={() => setIsConnectOpen(false)}
        />
      )}
    </article>
  );
}

function getStatusClass(status: ServerOnlineStatus) {
  if (status === 'online') return 'border-green-500/30 bg-green-500/20 text-green-200';
  if (status === 'offline') return 'border-red-500/30 bg-red-500/20 text-red-200';
  return 'border-white/15 bg-black/25 text-white/70';
}

function getStatusText(status: ServerOnlineStatus) {
  if (status === 'online') return 'Hoạt Động';
  if (status === 'offline') return 'Offline';
  return 'Chưa Rõ';
}

function formatPlayerCount(
  status: ServerOnlineStatus,
  online: number | null,
  total: number | null,
  presentation: 'online' | 'online-total',
) {
  const current = online ?? (status === 'offline' ? 0 : null);
  if (current === null) return presentation === 'online-total' ? '-- / --' : '--';
  if (presentation === 'online-total') return total === null ? `${current} / --` : `${current} / ${total}`;
  return String(current);
}

function ConnectDialog({ server, onClose }: { server: ServerStatus; onClose: () => void }) {
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasDirect = Boolean(server.connectionLink);
  const hasGuidance = Boolean(server.connectionGuide);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="w-full max-w-xl max-h-[80vh] bg-bg-sidebar border border-white/10 rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-white/10">
          <div className="min-w-0">
            <h3 id={headingId} className="font-semibold truncate">{server.gameName}</h3>
            <p className="text-sm text-text-secondary">Kết nối máy chủ</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white" aria-label="Đóng hộp thoại kết nối">
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {hasDirect && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <IconLink size={16} />
                Địa chỉ kết nối
              </div>
              <p className="break-all font-mono text-sm text-white/70">{server.connectionLink}</p>
            </div>
          )}

          {hasGuidance ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                <IconBook size={16} />
                Hướng dẫn
              </div>
              <div className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
                {server.connectionGuide}
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50">
              Máy chủ này chưa có hướng dẫn thêm.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            Đóng
          </button>
          {hasDirect && (
            <button
              type="button"
              onClick={() => {
                if (!server.connectionLink) return;
                openConnectionLink(server.connectionLink, server.game);
              }}
              className="rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-primary/80 flex items-center justify-center gap-2"
            >
              <IconExternalLink size={16} />
              Kết Nối
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
