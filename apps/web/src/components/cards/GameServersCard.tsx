"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { IconBook, IconExternalLink, IconLink, IconPlayerPlayFilled, IconServer, IconX } from '@tabler/icons-react';
import { ServerStatus } from '@/types/server';
import { openConnectionLink } from '@/lib/game-servers';

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

  return (
    <article className={`${layout === 'grid' ? 'min-w-0 w-full' : 'min-w-[300px] w-[300px]'} bg-card-bg rounded-[20px] p-4 flex flex-col gap-4 border border-white/5`}>
      <div className="flex items-center gap-3 min-w-0">
        {server.gameImage ? (
          <img src={server.gameImage} alt={server.gameName} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><IconServer size={22} /></div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{server.gameName}</h3>
          <p className="text-xs text-text-secondary truncate">
            {server.connectionLink || (hasGuidance ? 'Hướng dẫn kết nối' : 'Chưa cấu hình kết nối')}
          </p>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-10">
        {server.description || 'Sẵn sàng tham gia cùng cộng đồng.'}
      </p>

      <button
        type="button"
        disabled={!canOpenDialog}
        onClick={() => setIsConnectOpen(true)}
        className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/35 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium transition-colors"
      >
        <IconPlayerPlayFilled size={16} />
        {canOpenDialog ? 'Kết Nối' : 'Chưa Sẵn Sàng'}
      </button>

      {isConnectOpen && (
        <ConnectDialog
          server={server}
          onClose={() => setIsConnectOpen(false)}
        />
      )}
    </article>
  );
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
