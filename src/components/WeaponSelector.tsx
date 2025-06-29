'use client';

import { useState, useMemo } from 'react';
import { WeaponType } from '@/lib/github-data';
import { UserSkinConfig } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Target, Settings, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeaponSelectorProps {
  weapons: WeaponType[];
  userSkins: UserSkinConfig[];
  selectedTeam: 2 | 3;
  onWeaponSelect: (weapon: WeaponType) => void;
  isLoading?: boolean;
}

export default function WeaponSelector({
  weapons,
  userSkins,
  selectedTeam,
  onWeaponSelect,
  isLoading = false
}: WeaponSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (defindex: number) => {
    setImageErrors(prev => new Set(prev).add(defindex));
  };

  // Check if weapon is customized
  const isWeaponCustomized = (weapon: WeaponType) => {
    return userSkins.some(userSkin =>
      userSkin.weapon_defindex === weapon.weapon_defindex &&
      userSkin.weapon_team === selectedTeam
    );
  };

  // Get current skin for weapon
  const getCurrentSkin = (weapon: WeaponType) => {
    const userSkin = userSkins.find(userSkin =>
      userSkin.weapon_defindex === weapon.weapon_defindex &&
      userSkin.weapon_team === selectedTeam
    );
    return userSkin;
  };

  // Filter and sort weapons
  const filteredWeapons = useMemo(() => {
    let filtered = weapons.filter(weapon =>
      weapon.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by customization status first, then by name
    filtered.sort((a, b) => {
      const aCustomized = isWeaponCustomized(a);
      const bCustomized = isWeaponCustomized(b);

      // Prioritize customized weapons first
      if (aCustomized && !bCustomized) return -1;
      if (!aCustomized && bCustomized) return 1;

      // Then sort by name
      return a.display_name.localeCompare(b.display_name);
    });

    return filtered;
  }, [weapons, searchQuery, userSkins, selectedTeam]);

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
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search weapons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
          />
        </div>
        <Badge variant="outline" className="border-white/20 text-neutral-300">
          {filteredWeapons.length} weapons
        </Badge>
      </div>

      {/* Weapons Grid */}
      {filteredWeapons.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No weapons found</h3>
            <p className="text-neutral-400 text-center">
              {searchQuery ? 'Try adjusting your search terms' : 'No weapons available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredWeapons.map((weapon) => {
            const isCustomized = isWeaponCustomized(weapon);
            const currentSkin = getCurrentSkin(weapon);
            const hasError = imageErrors.has(weapon.weapon_defindex);

            return (
              <div
                key={weapon.weapon_defindex}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col cursor-pointer",
                  isCustomized && "border-green-500/30 bg-green-500/5"
                )}
                onClick={() => onWeaponSelect(weapon)}
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
                      src={weapon.default_skin.image}
                      alt={weapon.display_name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(weapon.weapon_defindex)}
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Category Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/50 hover:bg-black/50 text-white border-0 text-xs capitalize">
                      {weapon.category}
                    </Badge>
                  </div>

                  {/* Customized Badge */}
                  {isCustomized && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500/80 hover:bg-green-500/80 text-white border-0 text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Customized
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 leading-tight">
                      {weapon.display_name}
                    </h3>
                    
                    {currentSkin && (
                      <div className="text-xs text-neutral-400">
                        Current: {currentSkin.weapon_nametag || 'Default'}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWeaponSelect(weapon);
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
