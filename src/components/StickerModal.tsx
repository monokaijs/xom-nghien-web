'use client';

import { useState, useMemo, useEffect } from 'react';
import { Grid, CellComponentProps } from 'react-window';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { CS2Sticker } from '@/types/server';
import { cn } from '@/lib/utils';

interface StickerModalProps {
  open: boolean;
  onClose: () => void;
  stickers: CS2Sticker[];
  selectedStickers: (CS2Sticker | null)[];
  onSave: (stickers: (CS2Sticker | null)[]) => void;
}

interface DraggedItem {
  type: 'slot' | 'sticker';
  data: CS2Sticker | null;
  index?: number;
}

export default function StickerModal({ open, onClose, stickers, selectedStickers, onSave }: StickerModalProps) {
  const [localStickers, setLocalStickers] = useState<(CS2Sticker | null)[]>(selectedStickers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setLocalStickers(selectedStickers);
      setSearchQuery('');
      setSelectedSlot(null);
      setDraggedItem(null);
      setDragOverSlot(null);
    }
  }, [open, selectedStickers]);

  const filteredStickers = useMemo(() => {
    if (!searchQuery) return stickers;
    return stickers.filter(sticker =>
      sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stickers, searchQuery]);

  const handleStickerClick = (sticker: CS2Sticker) => {
    if (selectedSlot !== null) {
      const newStickers = [...localStickers];
      newStickers[selectedSlot] = sticker;
      setLocalStickers(newStickers);
      setSelectedSlot(null);
    } else {
      const firstEmptySlot = localStickers.findIndex(s => s === null);
      if (firstEmptySlot !== -1) {
        const newStickers = [...localStickers];
        newStickers[firstEmptySlot] = sticker;
        setLocalStickers(newStickers);
      }
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(selectedSlot === index ? null : index);
  };

  const handleRemoveSticker = (index: number) => {
    const newStickers = [...localStickers];
    newStickers[index] = null;
    setLocalStickers(newStickers);
  };

  const handleDragStart = (e: React.DragEvent, type: 'slot' | 'sticker', data: CS2Sticker | null, index?: number) => {
    setDraggedItem({ type, data, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'slot' && draggedItem.index !== undefined) {
      const sourceIndex = draggedItem.index;
      const targetIndex = targetSlotIndex;

      if (sourceIndex === targetIndex) return;

      const newStickers = [...localStickers];
      const temp = newStickers[sourceIndex];
      newStickers[sourceIndex] = newStickers[targetIndex];
      newStickers[targetIndex] = temp;
      setLocalStickers(newStickers);
    } else if (draggedItem.type === 'sticker' && draggedItem.data) {
      const newStickers = [...localStickers];
      newStickers[targetSlotIndex] = draggedItem.data;
      setLocalStickers(newStickers);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  const handleSave = () => {
    onSave(localStickers);
    onClose();
  };

  const handleCancel = () => {
    setLocalStickers(selectedStickers);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Select Stickers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white mb-3">Selected Stickers (Drag & drop or click slot to select)</div>
            <div className="flex gap-2">
              {localStickers.map((sticker, idx) => (
                <div
                  key={idx}
                  draggable={sticker !== null}
                  onClick={() => handleSlotClick(idx)}
                  onDragStart={(e) => sticker && handleDragStart(e, 'slot', sticker, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative w-20 h-20 bg-white/5 rounded border-2 transition-all",
                    sticker ? "cursor-move" : "cursor-pointer",
                    selectedSlot === idx ? "border-red-500" : "border-white/10 hover:border-white/30",
                    dragOverSlot === idx && "border-blue-500 bg-blue-500/10 scale-105"
                  )}
                >
                  {sticker ? (
                    <>
                      <img src={sticker.image} alt={sticker.name} className="w-full h-full object-contain p-2" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(idx);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                      Slot {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedSlot !== null && (
              <div className="mt-2 text-xs text-red-400">
                Slot {selectedSlot + 1} selected - Click a sticker or drag & drop
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
            />
          </div>

          <StickerGrid
            stickers={filteredStickers}
            localStickers={localStickers}
            selectedSlot={selectedSlot}
            onStickerClick={handleStickerClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Save Stickers
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StickerGridProps {
  stickers: CS2Sticker[];
  localStickers: (CS2Sticker | null)[];
  selectedSlot: number | null;
  onStickerClick: (sticker: CS2Sticker) => void;
  onDragStart: (e: React.DragEvent, type: 'slot' | 'sticker', data: CS2Sticker | null, index?: number) => void;
  onDragEnd: () => void;
}

interface CellProps {
  stickers: CS2Sticker[];
  localStickers: (CS2Sticker | null)[];
  onStickerClick: (sticker: CS2Sticker) => void;
  onDragStart: (e: React.DragEvent, type: 'slot' | 'sticker', data: CS2Sticker | null, index?: number) => void;
  onDragEnd: () => void;
  columnCount: number;
  itemSize: number;
  gap: number;
}

function StickerGrid({ stickers, localStickers, selectedSlot, onStickerClick, onDragStart, onDragEnd }: StickerGridProps) {
  if (stickers.length === 0) {
    return (
      <div className="max-h-[400px] bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="text-center text-neutral-400 py-8">
          No stickers found
        </div>
      </div>
    );
  }

  const columnCount = 8;
  const rowCount = Math.ceil(stickers.length / columnCount);
  const itemSize = 70;
  const gap = 12;
  const containerWidth = 800;
  const containerHeight = Math.min(400, rowCount * (itemSize + gap) + gap);

  const cellProps: CellProps = {
    stickers,
    localStickers,
    onStickerClick,
    onDragStart,
    onDragEnd,
    columnCount,
    itemSize,
    gap,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-1">
      <Grid
        cellComponent={Cell}
        cellProps={cellProps}
        columnCount={columnCount}
        columnWidth={itemSize + gap}
        rowCount={rowCount}
        rowHeight={itemSize + gap}
        style={{ height: containerHeight, width: containerWidth }}
        className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      />
    </div>
  );
}

function Cell({ columnIndex, rowIndex, style, stickers, localStickers, onStickerClick, onDragStart, onDragEnd, columnCount, itemSize, gap }: CellComponentProps<CellProps>) {
  const index = rowIndex * columnCount + columnIndex;
  if (index >= stickers.length) {
    return <div style={style} />;
  }

  const sticker = stickers[index];
  const isSelected = localStickers.some(s => s?.id === sticker.id);

  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + gap,
        top: Number(style.top) + gap,
        width: itemSize,
        height: itemSize,
      }}
    >
      <div
        draggable={true}
        onClick={() => onStickerClick(sticker)}
        onDragStart={(e) => onDragStart(e, 'sticker', sticker)}
        onDragEnd={onDragEnd}
        className={cn(
          "relative w-full h-full bg-white/5 rounded border transition-all cursor-move hover:border-red-500 hover:bg-red-500/10 hover:scale-105",
          isSelected
            ? "border-green-500 bg-green-500/10"
            : "border-white/10"
        )}
        title={sticker.name}
      >
        <img
          src={sticker.image}
          alt={sticker.name}
          className="w-full h-full object-contain p-2"
        />
      </div>
    </div>
  );
}

