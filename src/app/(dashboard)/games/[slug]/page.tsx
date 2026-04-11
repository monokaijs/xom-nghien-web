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
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';

export default function GameDetailPage() {
  const params = useParams<{ slug: string }>();
  const [game, setGame] = useState<FgGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
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

  const upscaleUrl = (url: string) => url.replace('.240p.', '.1080p.');
  const screenshots = game.screenshotImages?.filter(Boolean).map(upscaleUrl) || [];
  const downloads = game.downloadCollections?.filter(c => c.urls?.length > 0) || [];
  const torrents = game.torrentLinks?.filter(t => t.url) || [];
  const allMedia = screenshots.length > 0 ? screenshots : (game.postImage ? [upscaleUrl(game.postImage)] : []);

  return (
    <div className="flex flex-col gap-5 min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-10">
      <div className="max-w-[1100px] w-full mx-auto flex flex-col gap-5">

      <h1 className="text-3xl font-bold max-md:text-xl leading-tight">{game.title}</h1>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <div className="flex flex-col gap-2 min-w-0">
          {allMedia.length > 0 && (
            <>
              <button
                onClick={() => setLightboxIndex(activeScreenshot)}
                className="aspect-video rounded-[12px] overflow-hidden bg-bg-dark cursor-pointer"
              >
                <img
                  src={upscaleUrl(allMedia[activeScreenshot])}
                  alt={`Screenshot ${activeScreenshot + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>

              {allMedia.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {allMedia.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreenshot(i)}
                      className={`flex-shrink-0 w-[90px] aspect-video rounded-[6px] overflow-hidden transition-all border-2 ${
                        i === activeScreenshot
                          ? 'border-accent-primary opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          {game.postImage && (
            <div className="rounded-[10px] overflow-hidden bg-bg-dark">
              <img
                src={upscaleUrl(game.postImage)}
                alt={game.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {game.description && (
            <p className="text-text-secondary text-[13px] leading-relaxed line-clamp-4">{game.description}</p>
          )}

          <div className="flex flex-col gap-2 text-[13px]">
            {postDate && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary/60 uppercase text-[11px] tracking-wider">Ngày đăng:</span>
                <span className="text-text-secondary">{postDate}</span>
              </div>
            )}
            {game.link && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary/60 uppercase text-[11px] tracking-wider">Nguồn:</span>
                <a
                  href={game.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary hover:underline truncate ml-4"
                >
                  FitGirl Repacks
                </a>
              </div>
            )}
          </div>

          {game.features && game.features.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5">
                {game.features.slice(0, 6).map((feature, i) => (
                  <span
                    key={i}
                    className="bg-bg-dark/80 text-text-secondary text-[11px] px-2.5 py-1 rounded-[6px] border border-white/5"
                  >
                    {feature.length > 30 ? feature.slice(0, 30) + '…' : feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(downloads.length > 0 || torrents.length > 0) && (
        <div className="bg-card-bg rounded-[16px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconDownload size={20} className="text-accent-primary" />
            <h2 className="text-base font-semibold">Tải xuống</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {downloads.map((collection, i) => (
              <div key={i}>
                <p className="text-[11px] text-text-secondary/60 font-medium uppercase tracking-wider mb-2">
                  {collection.host}
                </p>
                <div className="flex flex-col gap-1">
                  {collection.urls.map((url, j) => (
                    <a
                      key={j}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-bg-dark hover:bg-bg-panel rounded-[8px] px-3 py-2 text-text-secondary hover:text-white transition-all text-sm truncate"
                    >
                      <IconDownload size={14} className="flex-shrink-0 text-accent-primary" />
                      <span className="truncate">Part {j + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}

            {torrents.length > 0 && (
              <div>
                <p className="text-[11px] text-text-secondary/60 font-medium uppercase tracking-wider mb-2">
                  Torrent
                </p>
                <div className="flex flex-col gap-1">
                  {torrents.map((t, i) => (
                    <a
                      key={i}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-bg-dark hover:bg-bg-panel rounded-[8px] px-3 py-2 text-text-secondary hover:text-white transition-all text-sm truncate"
                    >
                      <IconMagnet size={14} className="flex-shrink-0 text-accent-primary" />
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
        </div>
      )}

      {game.features && game.features.length > 6 && (
        <div className="bg-card-bg rounded-[16px] p-5">
          <h2 className="text-base font-semibold mb-3">Tính năng Repack</h2>
          <ul className="flex flex-col gap-1.5">
            {game.features.map((feature, i) => (
              <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {game.description && game.description.length > 200 && (
        <div className="bg-card-bg rounded-[16px] p-5">
          <h2 className="text-base font-semibold mb-3">Giới thiệu</h2>
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{game.description}</p>
        </div>
      )}

      {game.additionalNotes && (
        <div className="bg-card-bg rounded-[16px] p-5">
          <h2 className="text-base font-semibold mb-3">Ghi chú</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{game.additionalNotes}</p>
        </div>
      )}

      </div>

      {lightboxIndex !== null && allMedia.length > 0 && (
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

          {lightboxIndex < allMedia.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-6 text-white/70 hover:text-white transition-colors z-10"
            >
              <IconChevronRight size={36} />
            </button>
          )}

          <img
            src={allMedia[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
