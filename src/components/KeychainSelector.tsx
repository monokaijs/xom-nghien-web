'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Move } from 'lucide-react';
import { CS2Keychain } from '@/types/server';
import keychainsData from '@/data/keychains.json';

interface KeychainSelectorProps {
  selectedKeychain: CS2Keychain | null;
  onKeychainSelect: (keychain: CS2Keychain | null) => void;
}

export default function KeychainSelector({ selectedKeychain, onKeychainSelect }: KeychainSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [draggedKeychain, setDraggedKeychain] = useState<CS2Keychain | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const keychains = keychainsData as CS2Keychain[];

  const handleImageError = (keychainId: string) => {
    setImageErrors(prev => new Set(prev).add(keychainId));
  };

  // Filter keychains based on search query
  const filteredKeychains = useMemo(() => {
    if (!searchQuery) return keychains;
    return keychains.filter(keychain =>
      keychain.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [keychains, searchQuery]);

  const handleKeychainClick = (keychain: CS2Keychain) => {
    // If clicking the same keychain, deselect it
    if (selectedKeychain?.id === keychain.id) {
      onKeychainSelect(null);
    } else {
      onKeychainSelect(keychain);
    }
  };

  const handleRemoveKeychain = () => {
    onKeychainSelect(null);
  };

  // Drag and Drop handlers
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
      onKeychainSelect(draggedKeychain);
      setDraggedKeychain(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedKeychain(null);
    setIsDragOver(false);
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Keychain
          {selectedKeychain && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              Selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Keychain */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-300">Selected Keychain</h4>
          <p className="text-xs text-neutral-400">
            Drag a keychain from below to select it, or click to toggle selection
          </p>
          <div className="relative">
            {selectedKeychain ? (
              <div
                className="relative aspect-square w-24 border-2 border-green-500 bg-green-500/10 rounded-lg overflow-hidden group"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <img
                  src={selectedKeychain.image}
                  alt={selectedKeychain.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(selectedKeychain.id)}
                />
                {/* Drag indicator */}
                <div className="absolute top-1 left-1 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="w-2 h-2 text-white" />
                </div>
                <button
                  onClick={handleRemoveKeychain}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 truncate">
                  {selectedKeychain.name}
                </div>
              </div>
            ) : (
              <div
                className={`
                  aspect-square w-24 border-2 border-dashed rounded-lg flex items-center justify-center text-neutral-400 transition-all duration-200
                  ${isDragOver
                    ? 'border-green-500 bg-green-500/20 scale-105'
                    : 'border-white/20'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🔗</div>
                  <div className="text-xs">{isDragOver ? 'Drop here' : 'No keychain'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keychains..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
          />
        </div>

        {/* Keychain Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-300">
            Available Keychains ({filteredKeychains.length})
          </h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 pr-2">
              {filteredKeychains.map((keychain) => {
                const hasError = imageErrors.has(keychain.id);
                const isSelected = selectedKeychain?.id === keychain.id;
                
                return (
                  <div
                    key={keychain.id}
                    draggable={true}
                    onClick={() => handleKeychainClick(keychain)}
                    onDragStart={(e) => handleDragStart(e, keychain)}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative aspect-square border rounded-lg cursor-move transition-all duration-200 group hover:scale-105
                      ${isSelected
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }
                    `}
                    title={keychain.name}
                  >
                    {hasError ? (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800 rounded-md">
                        <span className="text-xs text-neutral-400 text-center p-1">
                          No Image
                        </span>
                      </div>
                    ) : (
                      <img
                        src={keychain.image}
                        alt={keychain.name}
                        className="w-full h-full object-cover rounded-md"
                        onError={() => handleImageError(keychain.id)}
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
                      {keychain.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {filteredKeychains.length === 0 && (
          <div className="text-center py-8 text-neutral-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No keychains found matching "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
