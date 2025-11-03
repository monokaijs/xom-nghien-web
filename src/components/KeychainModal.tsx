'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { CS2Keychain } from '@/types/server';
import { cn } from '@/lib/utils';

interface KeychainModalProps {
  open: boolean;
  onClose: () => void;
  keychains: CS2Keychain[];
  selectedKeychain: CS2Keychain | null;
  onSave: (keychain: CS2Keychain | null) => void;
}

export default function KeychainModal({ open, onClose, keychains, selectedKeychain, onSave }: KeychainModalProps) {
  const [localKeychain, setLocalKeychain] = useState<CS2Keychain | null>(selectedKeychain);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedKeychain, setDraggedKeychain] = useState<CS2Keychain | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredKeychains = useMemo(() => {
    if (!searchQuery) return keychains;
    return keychains.filter(keychain =>
      keychain.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [keychains, searchQuery]);

  const handleKeychainClick = (keychain: CS2Keychain) => {
    if (localKeychain?.id === keychain.id) {
      setLocalKeychain(null);
    } else {
      setLocalKeychain(keychain);
    }
  };

  const handleRemoveKeychain = () => {
    setLocalKeychain(null);
  };

  const handleDragStart = (e: React.DragEvent, keychain: CS2Keychain) => {
    setDraggedKeychain(keychain);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedKeychain) {
      setLocalKeychain(draggedKeychain);
      setDraggedKeychain(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedKeychain(null);
    setIsDragOver(false);
  };

  const handleSave = () => {
    onSave(localKeychain);
    onClose();
  };

  const handleCancel = () => {
    setLocalKeychain(selectedKeychain);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Select Keychain
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white mb-3">Selected Keychain (Drag & drop or click to select)</div>
            <div className="flex gap-2">
              <div
                className={cn(
                  "relative w-24 h-24 bg-white/5 rounded border-2 transition-all",
                  isDragOver ? "border-blue-500 bg-blue-500/10 scale-105" : "border-white/10"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {localKeychain ? (
                  <>
                    <img src={localKeychain.image} alt={localKeychain.name} className="w-full h-full object-contain p-2" />
                    <button
                      onClick={handleRemoveKeychain}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center truncate">
                      {localKeychain.name}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs text-center">
                    {isDragOver ? 'Drop here' : 'No Keychain'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search keychains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredKeychains.map((keychain) => (
                <div
                  key={keychain.id}
                  draggable={true}
                  onClick={() => handleKeychainClick(keychain)}
                  onDragStart={(e) => handleDragStart(e, keychain)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative aspect-square bg-white/5 rounded border-2 cursor-move transition-all hover:border-red-500 hover:bg-red-500/10 hover:scale-105",
                    localKeychain?.id === keychain.id ? "border-red-500 bg-red-500/20" : "border-white/10"
                  )}
                  title={keychain.name}
                >
                  <img
                    src={keychain.image}
                    alt={keychain.name}
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center truncate">
                    {keychain.name}
                  </div>
                </div>
              ))}
            </div>
            {filteredKeychains.length === 0 && (
              <div className="text-center text-neutral-400 py-8">
                No keychains found
              </div>
            )}
          </div>

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
              Save Keychain
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

