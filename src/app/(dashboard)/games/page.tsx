'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FG_CDN_BASE } from '@/config/cdn';
import { FgCatalogEntry, FgCatalog } from '@/types/fg-game';
import { IconSearch, IconLoader2, IconAlertTriangle, IconDeviceGamepad2 } from '@tabler/icons-react';

const PER_PAGE = 24;

export default function GamesPage() {
  const [catalog, setCatalog] = useState<FgCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${FG_CDN_BASE}/catalog.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: FgCatalog) => {
        setCatalog(data.games || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(g => g.title.toLowerCase().includes(q));
  }, [catalog, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 gap-3 text-text-secondary">
        <IconLoader2 size={24} className="animate-spin" />
        <span>Đang tải danh sách game...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-text-secondary">
        <IconAlertTriangle size={32} className="text-accent-primary" />
        <span>Không tải được dữ liệu: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-accent-primary to-[#ff8c42] flex items-center justify-center">
            <IconDeviceGamepad2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kho Game</h1>
            <p className="text-text-secondary text-xs mt-0.5">{catalog.length} game</p>
          </div>
        </div>

        <div className="bg-card-bg px-4 py-2.5 rounded-[15px] flex items-center gap-2.5 text-[#aaa] w-[280px] max-sm:w-full">
          <IconSearch size={18} />
          <input
            type="text"
            placeholder="Tìm game..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-white outline-none w-full placeholder-[#aaa] text-sm"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-text-secondary py-20">
          <IconSearch size={32} />
          <span>Không tìm thấy game nào</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {paginated.map(game => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group bg-card-bg rounded-[20px] overflow-hidden hover:ring-2 hover:ring-accent-primary/50 transition-all duration-300"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                {game.postImage ? (
                  <img
                    src={game.postImage}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-bg-dark flex items-center justify-center">
                    <IconDeviceGamepad2 size={40} className="text-text-secondary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-accent-primary transition-colors leading-snug">
                  {game.title}
                </h3>
                {game.date && (
                  <p className="text-text-secondary text-xs mt-2">
                    {new Date(game.date).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-[10px] text-sm font-medium transition-all ${
                  page === pageNum
                    ? 'bg-accent-primary text-white'
                    : 'bg-card-bg text-text-secondary hover:text-white hover:bg-bg-panel'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
