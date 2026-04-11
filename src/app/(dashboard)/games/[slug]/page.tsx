'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FG_CDN_BASE } from '@/config/cdn';
import { FgGameDetail } from '@/types/fg-game';
import {
  IconArrowLeft,
  IconCalendar,
  IconDownload,
  IconExternalLink,
  IconLoader2,
  IconAlertTriangle,
  IconMagnet,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';

export default function GameDetailPage() {
  const params = useParams<{ slug: string }>();
  const [game, setGame] = useState<FgGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    fetch(`${FG_CDN_BASE}/posts/${params.slug}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: FgGameDetail) => {
        setGame(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 gap-3 text-text-secondary">
        <IconLoader2 size={24} className="animate-spin" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-secondary">
        <IconAlertTriangle size={32} className="text-accent-primary" />
        <span>{error || 'Không tìm thấy game'}</span>
        <Link href="/games" className="text-accent-primary text-sm hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const postDate = game.date
    ? new Date(game.date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const screenshots = game.screenshotImages?.filter(Boolean) || [];
  const downloads = game.downloadCollections?.filter(c => c.urls?.length > 0) || [];
  const torrents = game.torrentLinks?.filter(t => t.url) || [];

  return (
    <div className="flex flex-col gap-6 min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-10">
      <Link
        href="/games"
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors w-fit text-sm"
      >
        <IconArrowLeft size={18} />
        Quay lại danh sách
      </Link>

      <div className="relative rounded-[30px] overflow-hidden min-h-[340px] max-md:min-h-[220px]">
        {game.postImage && (
          <img
            src={game.postImage}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[340px] max-md:min-h-[220px] p-8 max-md:p-5">
          <h1 className="text-4xl font-bold max-md:text-2xl leading-tight">{game.title}</h1>
          {postDate && (
            <div className="flex items-center gap-2 text-text-secondary text-sm mt-3">
              <IconCalendar size={16} />
              <span>{postDate}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 max-lg:grid-cols-1">
        <div className="flex flex-col gap-6 min-w-0">
          {game.description && (
            <div className="bg-card-bg rounded-[20px] p-6">
              <h2 className="text-lg font-semibold mb-3">Mô tả</h2>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{game.description}</p>
            </div>
          )}

          {game.features && game.features.length > 0 && (
            <div className="bg-card-bg rounded-[20px] p-6">
              <h2 className="text-lg font-semibold mb-3">Tính năng Repack</h2>
              <ul className="flex flex-col gap-2">
                {game.features.map((feature, i) => (
                  <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {screenshots.length > 0 && (
            <div className="bg-card-bg rounded-[20px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconPhoto size={20} className="text-accent-primary" />
                <h2 className="text-lg font-semibold">Ảnh chụp màn hình</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                {screenshots.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="aspect-video rounded-[12px] overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent-primary/50 transition-all"
                  >
                    <img
                      src={src}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {(downloads.length > 0 || torrents.length > 0) && (
            <div className="bg-card-bg rounded-[20px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconDownload size={20} className="text-accent-primary" />
                <h2 className="text-lg font-semibold">Tải xuống</h2>
              </div>

              {downloads.length > 0 && (
                <div className="flex flex-col gap-3">
                  {downloads.map((collection, i) => (
                    <div key={i}>
                      <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2">
                        {collection.host}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {collection.urls.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-bg-dark hover:bg-bg-panel rounded-[10px] px-3 py-2.5 text-text-secondary hover:text-white transition-all text-sm truncate"
                          >
                            <IconDownload size={14} className="flex-shrink-0" />
                            <span className="truncate">Part {j + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {torrents.length > 0 && (
                <div className={downloads.length > 0 ? 'mt-4 pt-4 border-t border-white/5' : ''}>
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2">
                    Torrent
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {torrents.map((t, i) => (
                      <a
                        key={i}
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-bg-dark hover:bg-bg-panel rounded-[10px] px-3 py-2.5 text-text-secondary hover:text-white transition-all text-sm truncate"
                      >
                        <IconMagnet size={14} className="flex-shrink-0" />
                        <span className="truncate">
                          {t.type === 'magnet' ? 'Magnet Link' : 'Torrent File'}
                          {torrents.length > 1 ? ` #${i + 1}` : ''}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {game.additionalNotes && (
            <div className="bg-card-bg rounded-[20px] p-6">
              <h2 className="text-lg font-semibold mb-3">Ghi chú</h2>
              <p className="text-text-secondary text-sm leading-relaxed">{game.additionalNotes}</p>
            </div>
          )}

          {game.link && (
            <a
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-bg-dark border border-white/10 hover:border-accent-primary text-text-secondary hover:text-white rounded-[15px] py-3 px-4 transition-all text-sm"
            >
              <IconExternalLink size={16} />
              Xem bài gốc
            </a>
          )}
        </div>
      </div>

      {lightboxIndex !== null && screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
          >
            <IconX size={28} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-6 text-white/70 hover:text-white transition-colors z-10"
            >
              <IconChevronLeft size={36} />
            </button>
          )}

          {lightboxIndex < screenshots.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-6 text-white/70 hover:text-white transition-colors z-10"
            >
              <IconChevronRight size={36} />
            </button>
          )}

          <img
            src={screenshots[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
