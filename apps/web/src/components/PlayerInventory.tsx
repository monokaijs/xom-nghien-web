"use client";

import React, {useEffect, useState} from 'react';
import {CS2_ITEMS, CS2Economy} from "@ianlucas/cs2-lib";
import type {CS2EconomyItem} from "@ianlucas/cs2-lib";

interface InventoryItem {
  id: number;
  wear?: number;
  seed?: number;
  statTrak?: number;
  equippedCT?: boolean;
  equippedT?: boolean;
  equipped?: boolean;
  containerId?: number;
}

interface InventoryData {
  items: Record<string, InventoryItem>;
  version: number;
}

interface PlayerInventoryProps {
  steamId: string;
  inventoryData: InventoryData | null;
}

export default function PlayerInventory({steamId, inventoryData}: PlayerInventoryProps) {
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<any>(null);

  const initializeEconomy = async () => {
    const cached = localStorage.getItem("vi_translation");

    if (cached) {
      CS2Economy.use({
        items: CS2_ITEMS,
        language: JSON.parse(cached)
      });
      return;
    }

    const response = await fetch('/translations/vi.json');
    const translation = await response.json();
    localStorage.setItem("vi_translation", JSON.stringify(translation));
    CS2Economy.use({
      items: CS2_ITEMS,
      language: translation
    });
  };

  useEffect(() => {
    (async () => {
      await initializeEconomy();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6">
        <h2 className="text-xl font-semibold mb-4">Kho Đồ</h2>
        <div className="flex items-center justify-center py-10">
          <div className="text-white/50">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!inventoryData) {
    return null;
  }

  const showcaseItems = Object.entries(inventoryData.items || {})
    .filter(([_, item]) => !item.containerId)
    .slice(0, 12)
    .map(([key, item]) => ({key, ...item}));

  if (showcaseItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6 max-md:p-4">
      <h2 className="text-xl font-semibold mb-4 max-md:text-lg">Kho Đồ</h2>
      <div
        className="grid grid-cols-10 gap-3 max-2xl:grid-cols-8 max-xl:grid-cols-7 max-lg:grid-cols-6 max-md:grid-cols-4 max-sm:grid-cols-3">
        {showcaseItems.map((item) => {
          try {
            const economyItem = CS2Economy.getById(item.id);
            const imageUrl = economyItem.getImage(item.wear);
            const rarityColor = getRarityColor(economyItem.rarity);

            return (
              <div
                key={item.key}
                className="bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 flex flex-col items-center overflow-hidden border-b-[3px] aspect-square cursor-pointer"
                style={{borderBottomColor: rarityColor}}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    item,
                    economyItem,
                    x: rect.left + rect.width / 2,
                    y: rect.top
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={imageUrl}
                    alt={economyItem.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  {item.statTrak !== undefined && item.statTrak >= 0 && (
                    <div
                      className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] px-1 py-0.5 rounded max-md:text-[8px]">
                      ST
                    </div>
                  )}
                  {item.wear !== undefined && (
                    <div
                      className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded max-md:text-[8px]">
                      {getWearName(item.wear)}
                    </div>
                  )}
                </div>
              </div>
            );
          } catch (err) {
            return null;
          }
        })}
      </div>
      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${hoveredItem.x}px`,
            top: `${hoveredItem.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/20 rounded-lg p-4 shadow-2xl min-w-[280px] max-w-[320px]">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={hoveredItem.economyItem.getImage(hoveredItem.item.wear)}
                alt={hoveredItem.economyItem.name}
                className="w-20 h-20 object-contain"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">
                  {hoveredItem.economyItem.name}
                </div>
                {hoveredItem.economyItem.category && (
                  <div className="text-xs text-white/60 capitalize">
                    {hoveredItem.economyItem.category}
                  </div>
                )}
              </div>
            </div>
            {(hoveredItem.economyItem as any).desc && (
              <div className="mb-3 pb-3 border-b border-white/10">
                <p className="text-xs text-white/70 italic leading-relaxed">
                  {(hoveredItem.economyItem as any).desc}
                </p>
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Float:</span>
                <span className="text-white font-mono">{(hoveredItem.item.wear || 0).toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Paint Seed:</span>
                <span className="text-white font-mono">{hoveredItem.item.seed || 0}</span>
              </div>
              {hoveredItem.item.statTrak !== undefined && hoveredItem.item.statTrak >= 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">StatTrak™:</span>
                  <span className="text-orange-500 font-medium">{hoveredItem.item.statTrak} Kills</span>
                </div>
              )}
              {hoveredItem.economyItem.rarity && (
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Rarity:</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{backgroundColor: getRarityColor(hoveredItem.economyItem.rarity)}}
                    />
                    <span className="text-white capitalize">{getRarityName(hoveredItem.economyItem.rarity)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWearName(wear: number): string {
  if (wear < 0.07) return 'FN';
  if (wear < 0.15) return 'MW';
  if (wear < 0.38) return 'FT';
  if (wear < 0.45) return 'WW';
  return 'BS';
}

function getWearFullName(wear: number): string {
  if (wear < 0.07) return 'Factory New';
  if (wear < 0.15) return 'Minimal Wear';
  if (wear < 0.38) return 'Field-Tested';
  if (wear < 0.45) return 'Well-Worn';
  return 'Battle-Scarred';
}

function getRarityColor(rarity: string | undefined): string {
  if (!rarity) return '#b0c3d9';

  if (rarity.startsWith('#')) {
    return rarity;
  }

  const rarityColors: Record<string, string> = {
    'common': '#b0c3d9',
    'uncommon': '#5e98d9',
    'rare': '#4b69ff',
    'mythical': '#8847ff',
    'legendary': '#d32ce6',
    'ancient': '#eb4b4b',
    'immortal': '#e4ae39',
  };

  return rarityColors[rarity.toLowerCase()] || '#b0c3d9';
}

function getRarityName(rarity: string | undefined): string {
  if (!rarity) return 'Cấp Tiêu Dùng';

  if (rarity.startsWith('#')) {
    const rarityNames: Record<string, string> = {
      '#b0c3d9': 'Cấp Tiêu Dùng',
      '#5e98d9': 'Cấp Công Nghiệp',
      '#4b69ff': 'Cấp Quân Đội',
      '#8847ff': 'Cấp Hạn Chế',
      '#d32ce6': 'Cấp Mật',
      '#eb4b4b': 'Cấp Đặc Biệt',
      '#e4ae39': 'Cấp Phi Thường',
    };
    return rarityNames[rarity] || 'Cấp Tiêu Dùng';
  }

  const rarityMap: Record<string, string> = {
    'common': 'Cấp Tiêu Dùng',
    'uncommon': 'Cấp Công Nghiệp',
    'rare': 'Cấp Quân Đội',
    'mythical': 'Cấp Hạn Chế',
    'legendary': 'Cấp Mật',
    'ancient': 'Cấp Đặc Biệt',
    'immortal': 'Cấp Phi Thường',
  };

  return rarityMap[rarity.toLowerCase()] || 'Cấp Tiêu Dùng';
}



