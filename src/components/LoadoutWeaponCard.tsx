'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CS2Skin, CS2Agent, CS2Glove, CS2Music, CS2Sticker, CS2Keychain, UserSkinConfig } from '@/types/server';
import { Target, Edit, Star, Tag, Sparkles, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadoutItem {
  userConfig: UserSkinConfig;
  skinData?: CS2Skin;
  agentData?: CS2Agent;
  gloveData?: CS2Glove;
  musicData?: CS2Music;
  stickers: (CS2Sticker | null)[];
  keychain: CS2Keychain | null;
  category: string;
  weaponName: string;
}

interface LoadoutWeaponCardProps {
  item?: LoadoutItem;
  placeholder?: {
    weaponName: string;
    category: string;
    defindex?: number;
  };
  team: 2 | 3;
  className?: string;
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500', shortName: 'FN' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500', shortName: 'MW' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500', shortName: 'FT' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500', shortName: 'WW' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500', shortName: 'BS' },
];

export default function LoadoutWeaponCard({ item, placeholder, team, className }: LoadoutWeaponCardProps) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const getWearCondition = (wear: number) => {
    return wearConditions.find(condition => wear >= condition.min && wear < condition.max) || wearConditions[0];
  };

  const handleEdit = () => {
    if (item) {
      // Navigate to customize page with existing item data
      if (item.skinData) {
        const weaponData = encodeURIComponent(JSON.stringify(item.skinData));
        router.push(`/skin-changer/customize?weapon=${weaponData}&team=${team}`);
      } else if (item.agentData) {
        const agentData = encodeURIComponent(JSON.stringify(item.agentData));
        router.push(`/skin-changer/customize?agent=${agentData}&team=${team}`);
      }
    } else if (placeholder) {
      // Navigate to skin selector for this weapon category
      router.push(`/skin-changer?category=${placeholder.category}`);
    }
  };

  // Render placeholder card for uncustomized slots
  if (!item && placeholder) {
    return (
      <div className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm border-dashed rounded-xl flex flex-col",
        className
      )}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 text-neutral-400">
            <Target className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm opacity-75">No skin equipped</span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-white font-medium text-sm mb-2 h-[2rem] line-clamp-2 leading-tight opacity-75">
            {placeholder.weaponName}
          </h3>

          <div className="mt-auto">
            <Button
              size="sm"
              onClick={handleEdit}
              className="text-xs px-3 py-1 h-7 w-full bg-white/10 hover:bg-red-500 text-white"
            >
              <Edit className="w-3 h-3 mr-1" />
              Customize
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const currentCondition = item.userConfig.weapon_wear ? getWearCondition(item.userConfig.weapon_wear) : null;
  const itemImage = item.skinData?.image || item.agentData?.image || item.gloveData?.image || item.musicData?.image || '';
  const itemName = item.weaponName;
  const hasStickers = item.stickers.some(sticker => sticker !== null);
  const hasKeychain = item.keychain !== null;
  const hasNameTag = item.userConfig.weapon_nametag && item.userConfig.weapon_nametag.trim() !== '';
  const isStatTrak = item.userConfig.weapon_stattrak === 1;

  return (
    <div className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col",
      className
    )}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
          {imageError || !itemImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
              <Target className="w-8 h-8 mb-2" />
              <span className="text-sm">Image not available</span>
            </div>
          ) : (
            <img
              src={itemImage}
              alt={itemName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}

          {/* Overlay with badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {isStatTrak && (
              <Badge variant="secondary" className="text-xs bg-orange-500/80 text-white border-0">
                <Star className="w-3 h-3 mr-1" />
                ST
              </Badge>
            )}
            {currentCondition && (
              <Badge variant="secondary" className={cn("text-xs text-white border-0", currentCondition.color)}>
                {currentCondition.shortName}
              </Badge>
            )}
          </div>

          {/* Bottom badges */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {hasNameTag && (
              <Badge variant="secondary" className="text-xs bg-blue-500/80 text-white border-0">
                <Tag className="w-3 h-3 mr-1" />
                Named
              </Badge>
            )}
            {hasStickers && (
              <Badge variant="secondary" className="text-xs bg-purple-500/80 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                {item.stickers.filter(s => s !== null).length}
              </Badge>
            )}
            {hasKeychain && (
              <Badge variant="secondary" className="text-xs bg-green-500/80 text-white border-0">
                <LinkIcon className="w-3 h-3 mr-1" />
                KC
              </Badge>
            )}
          </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="text-white font-medium text-sm mb-1 h-[2rem] line-clamp-2 leading-tight">
            {isStatTrak && 'StatTrak™ '}
            {itemName}
            {hasNameTag && ` "${item.userConfig.weapon_nametag}"`}
          </h3>

          {currentCondition && (
            <div className="flex items-center gap-1 mb-1">
              <div className={cn("w-2 h-2 rounded-full", currentCondition.color)} />
              <span className="text-xs text-neutral-400">
                {currentCondition.name} ({item.userConfig.weapon_wear?.toFixed(3)})
              </span>
            </div>
          )}

          {item.userConfig.weapon_seed !== undefined && item.userConfig.weapon_seed > 0 && (
            <div className="text-xs text-neutral-500">
              Pattern: {item.userConfig.weapon_seed}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <Button
            size="sm"
            onClick={handleEdit}
            className="text-xs px-3 py-1 h-7 w-full bg-white/10 hover:bg-red-500 text-white"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
