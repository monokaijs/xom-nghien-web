"use client";

import React, { useEffect, useState } from 'react';
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";

CS2Economy.use({
  items: CS2_ITEMS,
  language: english
});

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
}

export default function PlayerInventory({ steamId }: PlayerInventoryProps) {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}/inventory`);

        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }

        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [steamId]);

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

  if (error || !inventory) {
    return null;
  }

  const showcaseItems = Object.entries(inventory.items || {})
    .filter(([_, item]) => !item.containerId)
    .slice(0, 12)
    .map(([key, item]) => ({ key, ...item }));

  if (showcaseItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-6 max-md:p-4">
      <h2 className="text-xl font-semibold mb-4 max-md:text-lg">Kho Đồ</h2>
      <div className="grid grid-cols-10 gap-3 max-2xl:grid-cols-8 max-xl:grid-cols-7 max-lg:grid-cols-6 max-md:grid-cols-4 max-sm:grid-cols-3">
        {showcaseItems.map((item) => {
          try {
            const economyItem = CS2Economy.getById(item.id);
            const imageUrl = economyItem.getImage(item.wear);
            const rarityColor = getRarityColor(economyItem.rarity);

            return (
              <div
                key={item.key}
                className="bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 flex flex-col items-center overflow-hidden border-b-[3px] aspect-square"
                style={{ borderBottomColor: rarityColor }}
              >
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={imageUrl}
                    alt={economyItem.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  {item.statTrak !== undefined && item.statTrak >= 0 && (
                    <div className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] px-1 py-0.5 rounded max-md:text-[8px]">
                      ST
                    </div>
                  )}
                  {item.wear !== undefined && (
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded max-md:text-[8px]">
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

