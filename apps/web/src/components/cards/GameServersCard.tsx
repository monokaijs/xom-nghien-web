"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { IconBook, IconLink, IconPlayerPlayFilled, IconServer, IconX } from '@tabler/icons-react';
import { ServerStatus } from '@/types/server';
import { openConnectionLink, type ConnectionMethod } from '@/lib/game-servers';

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
  const preferredMethod = server.connectionMethod === 'guidance' && hasGuidance
    ? 'guidance'
    : hasDirect
      ? 'direct'
      : 'guidance';
  const [selectedMethod, setSelectedMethod] = useState<ConnectionMethod>(preferredMethod);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const availableMethods = [
    hasDirect ? 'direct' : null,
    hasGuidance ? 'guidance' : null,
  ].filter(Boolean) as ConnectionMethod[];
  const activeMethod = availableMethods.includes(selectedMethod)
    ? selectedMethod
    : availableMethods[0] || 'direct';
  const canConnect = availableMethods.length > 0;

  const connect = () => {
    if (activeMethod === 'guidance') {
      setIsGuideOpen(true);
      return;
    }

    if (server.connectionLink) {
      openConnectionLink(server.connectionLink, server.game);
    }
  };

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
            {server.connectionLink || (server.connectionGuide ? 'Hướng dẫn kết nối' : 'Chưa cấu hình kết nối')}
          </p>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-10">
        {server.description || 'Sẵn sàng tham gia cùng cộng đồng.'}
      </p>

      {availableMethods.length > 1 && (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
          <ConnectionMethodButton
            active={activeMethod === 'direct'}
            icon={<IconLink size={15} />}
            label="Liên kết"
            onClick={() => setSelectedMethod('direct')}
          />
          <ConnectionMethodButton
            active={activeMethod === 'guidance'}
            icon={<IconBook size={15} />}
            label="Hướng dẫn"
            onClick={() => setSelectedMethod('guidance')}
          />
        </div>
      )}

      <button
        type="button"
        disabled={!canConnect}
        onClick={connect}
        className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/35 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium transition-colors"
      >
        {activeMethod === 'guidance' ? <IconBook size={16} /> : <IconPlayerPlayFilled size={16} />}
        {canConnect ? (activeMethod === 'guidance' ? 'Xem Hướng Dẫn' : 'Tham Gia') : 'Chưa Sẵn Sàng'}
      </button>

      {isGuideOpen && server.connectionGuide && (
        <GuideModal
          gameName={server.gameName}
          guide={server.connectionGuide}
          onClose={() => setIsGuideOpen(false)}
        />
      )}
    </article>
  );
}

function ConnectionMethodButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-lg px-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
        active ? 'bg-accent-primary text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function GuideModal({ gameName, guide, onClose }: { gameName: string; guide: string; onClose: () => void }) {
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
            <h3 id={headingId} className="font-semibold truncate">{gameName}</h3>
            <p className="text-sm text-text-secondary">Hướng dẫn kết nối</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white" aria-label="Đóng hướng dẫn kết nối">
            <IconX size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto text-sm leading-6 text-white/80 whitespace-pre-wrap break-words">
          {guide}
        </div>
      </div>
    </div>
  );
}
