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
          ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4'
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
      className={`${layout === 'grid' ? 'min-w-0 w-full' : 'min-w-[350px] w-[350px]'} group relative aspect-video overflow-hidden rounded-[25px] bg-[#242427] bg-cover bg-center shadow-lg ring-1 ring-inset ring-white/5`}
      style={{ backgroundImage: backgroundImages || undefined }}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-bg-dark/80 via-bg-dark/45 to-bg-dark/90 transition-colors duration-300 group-hover:via-bg-dark/30" />

      <div className="absolute inset-x-4 top-4 z-20 sm:inset-x-5 sm:top-5">
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

      <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between gap-4 sm:inset-x-5 sm:bottom-5">
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

          {hasGuidance && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                <IconBook size={16} />
                Hướng dẫn
              </div>
              <div className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
                {server.connectionGuide}
              </div>
            </div>
          )}

          {server.game === 'cs2' && (
            <Cs2PlayerList server={server} className={hasGuidance ? 'mt-4' : ''} />
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

function Cs2PlayerList({ server, className = '' }: { server: ServerStatus; className?: string }) {
  const { online, total, list } = server.metadata.players;
  const count = online === null ? '--' : String(online);
  const capacity = total === null ? '' : ` / ${total}`;

  return (
    <div className={`${className} rounded-2xl border border-white/10 bg-white/[0.03] p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white/80">Người chơi</div>
        <div className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/70">
          {count}{capacity}
        </div>
      </div>

      {list.length > 0 ? (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {list.map((player, index) => (
            <div key={`${player.name}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-xs font-semibold text-accent-primary">
                  {index + 1}
                </span>
                <span className="truncate text-sm text-white/85">{player.name}</span>
              </div>
              {(player.raw?.score !== undefined || player.raw?.time !== undefined) && (
                <div className="flex shrink-0 items-center gap-3 text-xs text-white/45">
                  {player.raw.score !== undefined && <span>{player.raw.score} điểm</span>}
                  {player.raw.time !== undefined && <span>{formatPlayerTime(player.raw.time)}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-white/45">
          {getEmptyPlayerText(server)}
        </p>
      )}
    </div>
  );
}

function getEmptyPlayerText(server: ServerStatus) {
  if (server.metadata.status === 'offline') return 'Máy chủ đang offline.';
  if (server.metadata.players.online && server.metadata.players.online > 0) {
    return 'Không thể tải tên người chơi.';
  }
  if (server.metadata.players.online === 0) return 'Chưa có người chơi trực tuyến.';
  return 'Chưa có dữ liệu người chơi.';
}

function formatPlayerTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
