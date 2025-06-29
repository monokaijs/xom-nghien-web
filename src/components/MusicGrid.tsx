'use client';

import { useState, useMemo } from 'react';
import { CS2Music } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music, Search, Volume2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicGridProps {
  musicKits: CS2Music[];
  onMusicSelect: (music: CS2Music) => void;
  isLoading?: boolean;
}

export default function MusicGrid({
  musicKits,
  onMusicSelect,
  isLoading = false
}: MusicGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (musicId: string) => {
    setImageErrors(prev => new Set(prev).add(musicId));
  };

  // Filter music kits
  const filteredMusicKits = useMemo(() => {
    return musicKits.filter(music =>
      music.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      // Sort Default first, then alphabetically
      if (a.name === 'Default') return -1;
      if (b.name === 'Default') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [musicKits, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="aspect-square bg-white/10 rounded-lg mb-3" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search music kits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
          />
        </div>
        <Badge variant="outline" className="border-white/20 text-neutral-300">
          {filteredMusicKits.length} music kits
        </Badge>
      </div>

      {/* Music Kits Grid */}
      {filteredMusicKits.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="w-12 h-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No music kits found</h3>
            <p className="text-neutral-400 text-center">
              {searchQuery ? 'Try adjusting your search terms' : 'No music kits available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMusicKits.map((music) => {
            const hasError = imageErrors.has(music.id);
            const isDefault = music.name === 'Default';

            return (
              <div
                key={music.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col cursor-pointer",
                  isDefault && "border-blue-500/30 bg-blue-500/5"
                )}
                onClick={() => onMusicSelect(music)}
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-t-xl">
                  {hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                      <Music className="w-8 h-8 mb-2" />
                      <span className="text-sm">Image not available</span>
                    </div>
                  ) : (
                    <img
                      src={music.image}
                      alt={music.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(music.id)}
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Default Badge */}
                  {isDefault && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-500/80 hover:bg-blue-500/80 text-white border-0 text-xs">
                        Default
                      </Badge>
                    </div>
                  )}

                  {/* Play Icon */}
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 leading-tight">
                      {music.name}
                    </h3>
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMusicSelect(music);
                      }}
                    >
                      {isDefault ? 'Use Default' : 'Select Music'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
