'use client';

import { useState, useMemo } from 'react';
import { CS2Skin, CS2Glove, UserSkinConfig } from '@/types/server';
import { WeaponType } from '@/lib/github-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Target, Settings, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeaponSkinsGridProps {
  weapon: WeaponType;
  skins: (CS2Skin | CS2Glove)[];
  userSkins: UserSkinConfig[];
  selectedTeam: 2 | 3;
  onSkinSelect: (skin: CS2Skin | CS2Glove) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function WeaponSkinsGrid({
  weapon,
  skins,
  userSkins,
  selectedTeam,
  onSkinSelect,
  onBack,
  isLoading = false
}: WeaponSkinsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (skinId: string) => {
    setImageErrors(prev => new Set(prev).add(skinId));
  };

  // Check if skin is customized
  const isSkinCustomized = (skin: CS2Skin | CS2Glove) => {
    return userSkins.some(userSkin =>
      userSkin.weapon_defindex === skin.weapon_defindex &&
      userSkin.weapon_team === selectedTeam &&
      userSkin.weapon_paint_id == skin.paint
    );
  };

  // Get rarity color for skin
  const getRarityColor = (skin: CS2Skin | CS2Glove) => {
    const name = skin.paint_name.toLowerCase();
    if (name.includes('dragon') || name.includes('howl') || name.includes('medusa')) {
      return 'from-red-500 to-red-700'; // Contraband
    }
    if (name.includes('asiimov') || name.includes('hyper beast') || name.includes('neon rider')) {
      return 'from-pink-500 to-pink-700'; // Covert
    }
    if (name.includes('redline') || name.includes('vulcan') || name.includes('ak-47')) {
      return 'from-purple-500 to-purple-700'; // Classified
    }
    if (name.includes('blue') || name.includes('steel')) {
      return 'from-blue-500 to-blue-700'; // Restricted
    }
    return 'from-neutral-500 to-neutral-700'; // Default
  };

  // Filter and sort skins
  const filteredSkins = useMemo(() => {
    let filtered = skins.filter(skin =>
      skin.paint_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by customization status first, then by name
    filtered.sort((a, b) => {
      const aCustomized = isSkinCustomized(a);
      const bCustomized = isSkinCustomized(b);

      // Prioritize customized skins first
      if (aCustomized && !bCustomized) return -1;
      if (!aCustomized && bCustomized) return 1;

      // Then sort by name
      return a.paint_name.localeCompare(b.paint_name);
    });

    return filtered;
  }, [skins, searchQuery, userSkins, selectedTeam]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-20 bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="aspect-[4/3] bg-white/10 rounded-lg mb-3" />
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="border-white/20 text-neutral-300 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-white">{weapon.display_name}</h2>
          <p className="text-neutral-400 text-sm">Choose a skin for this weapon</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search skins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
          />
        </div>
        <Badge variant="outline" className="border-white/20 text-neutral-300">
          {filteredSkins.length} skins
        </Badge>
      </div>

      {/* Skins Grid */}
      {filteredSkins.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No skins found</h3>
            <p className="text-neutral-400 text-center">
              {searchQuery ? 'Try adjusting your search terms' : 'No skins available for this weapon'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSkins.map((skin) => {
            const isCustomized = isSkinCustomized(skin);
            const skinId = `${skin.weapon_defindex}-${skin.paint}`;
            const hasError = imageErrors.has(skinId);

            return (
              <div
                key={skinId}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col cursor-pointer",
                  isCustomized && "border-green-500/30 bg-green-500/5"
                )}
                onClick={() => onSkinSelect(skin)}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                  {hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                      <Target className="w-8 h-8 mb-2" />
                      <span className="text-sm">Image not available</span>
                    </div>
                  ) : (
                    <img
                      src={skin.image}
                      alt={skin.paint_name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(skinId)}
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Rarity Indicator */}
                  <div className={cn(
                    'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br', getRarityColor(skin)
                  )}>
                    <Star className="w-4 h-4 text-white" />
                  </div>

                  {/* Customized Badge */}
                  {isCustomized && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500/80 hover:bg-green-500/80 text-white border-0 text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Equipped
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 leading-tight">
                      {skin.paint_name}
                    </h3>
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkinSelect(skin);
                      }}
                    >
                      {isCustomized ? 'Modify' : 'Customize'}
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
