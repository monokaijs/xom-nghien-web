'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Plus, Move } from 'lucide-react';
import { CS2Sticker } from '@/types/server';
import stickersData from '@/data/stickers.json';

interface StickerSelectorProps {
  selectedStickers: (CS2Sticker | null)[];
  onStickerSelect: (index: number, sticker: CS2Sticker | null) => void;
}

export default function StickerSelector({ selectedStickers, onStickerSelect }: StickerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ type: 'slot' | 'sticker'; data: any; index?: number } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const stickers = stickersData as CS2Sticker[];

  const handleImageError = (stickerId: string) => {
    setImageErrors(prev => new Set(prev).add(stickerId));
  };

  // Filter stickers based on search query
  const filteredStickers = useMemo(() => {
    if (!searchQuery) return stickers;
    return stickers.filter(sticker =>
      sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stickers, searchQuery]);

  const handleStickerClick = (sticker: CS2Sticker) => {
    if (selectedSlot !== null) {
      onStickerSelect(selectedSlot, sticker);
      setSelectedSlot(null);
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(selectedSlot === index ? null : index);
  };

  const handleRemoveSticker = (index: number) => {
    onStickerSelect(index, null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'slot' | 'sticker', data: any, index?: number) => {
    setDraggedItem({ type, data, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the slot area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'slot' && draggedItem.index !== undefined) {
      // Swapping between slots
      const sourceIndex = draggedItem.index;
      const targetIndex = targetSlotIndex;

      if (sourceIndex === targetIndex) return;

      const newStickers = [...selectedStickers];
      const temp = newStickers[sourceIndex];
      newStickers[sourceIndex] = newStickers[targetIndex];
      newStickers[targetIndex] = temp;

      // Update all affected slots
      newStickers.forEach((sticker, index) => {
        onStickerSelect(index, sticker);
      });
    } else if (draggedItem.type === 'sticker') {
      // Adding sticker from gallery to slot
      onStickerSelect(targetSlotIndex, draggedItem.data);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Stickers
          <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
            {selectedStickers.filter(s => s !== null).length}/5
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sticker Slots */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-300">Selected Stickers</h4>
          <div className="grid grid-cols-5 gap-2">
            {selectedStickers.map((sticker, index) => (
              <div
                key={index}
                draggable={sticker !== null}
                onClick={() => handleSlotClick(index)}
                onDragStart={(e) => sticker && handleDragStart(e, 'slot', sticker, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative aspect-square border-2 rounded-lg transition-all duration-200 group
                  ${selectedSlot === index
                    ? 'border-red-500 bg-red-500/20'
                    : dragOverSlot === index
                    ? 'border-green-500 bg-green-500/20 scale-105'
                    : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                  }
                  ${sticker ? 'cursor-move' : 'cursor-pointer'}
                `}
              >
                {sticker ? (
                  <>
                    <img
                      src={sticker.image}
                      alt={sticker.name}
                      className="w-full h-full object-cover rounded-md"
                      onError={() => handleImageError(sticker.id)}
                    />
                    {/* Drag indicator */}
                    <div className="absolute top-1 left-1 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Move className="w-2 h-2 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSticker(index);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Plus className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedSlot !== null ? (
            <p className="text-sm text-red-300">
              Click a sticker below to add it to slot {selectedSlot + 1}
            </p>
          ) : (
            <p className="text-sm text-neutral-400">
              Drag stickers from below to slots above, or drag between slots to swap
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stickers..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
          />
        </div>

        {/* Sticker Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-300">
            Available Stickers ({filteredStickers.length})
          </h4>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 pr-2">
              {filteredStickers.map((sticker) => {
                const hasError = imageErrors.has(sticker.id);
                const isSelected = selectedStickers.some(s => s?.id === sticker.id);
                
                return (
                  <div
                    key={sticker.id}
                    draggable={true}
                    onClick={() => selectedSlot !== null && handleStickerClick(sticker)}
                    onDragStart={(e) => handleDragStart(e, 'sticker', sticker)}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative aspect-square border rounded-lg transition-all duration-200 group cursor-move
                      ${selectedSlot !== null
                        ? 'hover:border-red-400 hover:bg-red-500/10'
                        : ''
                      }
                      ${isSelected
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/20 bg-white/5'
                      }
                      hover:scale-105
                    `}
                    title={sticker.name}
                  >
                    {hasError ? (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800 rounded-md">
                        <span className="text-xs text-neutral-400 text-center p-1">
                          No Image
                        </span>
                      </div>
                    ) : (
                      <img
                        src={sticker.image}
                        alt={sticker.name}
                        className="w-full h-full object-cover rounded-md"
                        onError={() => handleImageError(sticker.id)}
                      />
                    )}
                    
                    {/* Drag indicator */}
                    <div className="absolute top-1 left-1 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Move className="w-2 h-2 text-white" />
                    </div>

                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                      {sticker.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {filteredStickers.length === 0 && (
          <div className="text-center py-8 text-neutral-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No stickers found matching "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
