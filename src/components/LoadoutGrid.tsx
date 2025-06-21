'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadoutWeaponCard from '@/components/LoadoutWeaponCard';
import { CS2Skin, CS2Agent, CS2Glove, CS2Music, CS2Sticker, CS2Keychain, UserSkinConfig } from '@/types/server';
import { 
  Target, 
  Zap, 
  Bomb, 
  Crosshair, 
  Shield, 
  Sword, 
  Hand, 
  User, 
  Music 
} from 'lucide-react';
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

interface CategorizedLoadout {
  pistols: LoadoutItem[];
  rifles: LoadoutItem[];
  smg: LoadoutItem[];
  machineguns: LoadoutItem[];
  snipers: LoadoutItem[];
  shotguns: LoadoutItem[];
  knives: LoadoutItem[];
  gloves: LoadoutItem[];
  agents: LoadoutItem[];
  music: LoadoutItem[];
}

interface LoadoutGridProps {
  loadout: CategorizedLoadout;
  team: 2 | 3;
  isLoading?: boolean;
}

interface CategoryConfig {
  id: keyof CategorizedLoadout;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  placeholders?: { weaponName: string; defindex?: number }[];
}

const categoryConfigs: CategoryConfig[] = [
  {
    id: 'pistols',
    name: 'Pistols',
    icon: Target,
    description: 'Secondary weapons',
    placeholders: [
      { weaponName: 'Glock-18', defindex: 2 },
      { weaponName: 'USP-S', defindex: 61 },
      { weaponName: 'P2000', defindex: 32 },
      { weaponName: 'Desert Eagle', defindex: 1 },
      { weaponName: 'Dual Berettas', defindex: 2 },
      { weaponName: 'Five-SeveN', defindex: 3 },
      { weaponName: 'Tec-9', defindex: 30 },
      { weaponName: 'CZ75-Auto', defindex: 63 },
      { weaponName: 'P250', defindex: 4 },
      { weaponName: 'R8 Revolver', defindex: 64 },
    ]
  },
  {
    id: 'rifles',
    name: 'Rifles',
    icon: Target,
    description: 'Primary assault rifles',
    placeholders: [
      { weaponName: 'AK-47', defindex: 7 },
      { weaponName: 'M4A4', defindex: 16 },
      { weaponName: 'M4A1-S', defindex: 60 },
      { weaponName: 'AUG', defindex: 8 },
      { weaponName: 'SG 553', defindex: 39 },
      { weaponName: 'FAMAS', defindex: 10 },
      { weaponName: 'Galil AR', defindex: 13 },
    ]
  },
  {
    id: 'smg',
    name: 'SMG',
    icon: Zap,
    description: 'Submachine guns',
    placeholders: [
      { weaponName: 'MP7', defindex: 33 },
      { weaponName: 'MP9', defindex: 34 },
      { weaponName: 'PP-Bizon', defindex: 26 },
      { weaponName: 'MAC-10', defindex: 17 },
      { weaponName: 'UMP-45', defindex: 24 },
      { weaponName: 'P90', defindex: 19 },
      { weaponName: 'MP5-SD', defindex: 23 },
    ]
  },
  {
    id: 'machineguns',
    name: 'Machine Guns',
    icon: Bomb,
    description: 'Heavy machine guns',
    placeholders: [
      { weaponName: 'M249', defindex: 14 },
      { weaponName: 'Negev', defindex: 28 },
    ]
  },
  {
    id: 'snipers',
    name: 'Sniper Rifles',
    icon: Crosshair,
    description: 'Long-range precision weapons',
    placeholders: [
      { weaponName: 'AWP', defindex: 9 },
      { weaponName: 'SSG 08', defindex: 40 },
      { weaponName: 'SCAR-20', defindex: 38 },
      { weaponName: 'G3SG1', defindex: 11 },
    ]
  },
  {
    id: 'shotguns',
    name: 'Shotguns',
    icon: Shield,
    description: 'Close-range weapons',
    placeholders: [
      { weaponName: 'Nova', defindex: 35 },
      { weaponName: 'XM1014', defindex: 25 },
      { weaponName: 'Sawed-Off', defindex: 29 },
      { weaponName: 'MAG-7', defindex: 27 },
    ]
  },
  {
    id: 'knives',
    name: 'Knives',
    icon: Sword,
    description: 'Melee weapons',
    placeholders: [
      { weaponName: 'Default Knife', defindex: 42 },
    ]
  },
  {
    id: 'gloves',
    name: 'Gloves',
    icon: Hand,
    description: 'Hand wraps and glove skins',
    placeholders: [
      { weaponName: 'Default Gloves', defindex: 5027 },
    ]
  },
  {
    id: 'agents',
    name: 'Agents',
    icon: User,
    description: 'Player models',
    placeholders: [
      { weaponName: 'Default Agent', defindex: 0 },
    ]
  },
  {
    id: 'music',
    name: 'Music Kits',
    icon: Music,
    description: 'MVP music and sound effects',
    placeholders: [
      { weaponName: 'Default Music', defindex: -1 },
    ]
  },
];

export default function LoadoutGrid({ loadout, team, isLoading = false }: LoadoutGridProps) {
  const categoriesWithItems = useMemo(() => {
    return categoryConfigs.map(config => {
      const items = loadout[config.id] || [];
      const placeholders = config.placeholders || [];
      
      // Create placeholder items for weapons not yet customized
      const placeholderItems = placeholders.filter(placeholder => {
        // Check if this weapon is already customized
        return !items.some(item => 
          item.userConfig.weapon_defindex === placeholder.defindex
        );
      }).map(placeholder => ({
        weaponName: placeholder.weaponName,
        category: config.id,
        defindex: placeholder.defindex
      }));

      return {
        ...config,
        items,
        placeholderItems,
        totalItems: items.length + placeholderItems.length
      };
    });
  }, [loadout]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {categoryConfigs.map((category) => (
          <Card key={category.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center animate-pulse">
                  <category.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-sm text-neutral-400 font-normal">{category.description}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="bg-white/5 border-white/10 animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-neutral-700/50 rounded-t-lg" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                        <div className="h-6 bg-neutral-700/50 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categoriesWithItems.map((category) => {
        if (category.totalItems === 0) return null;

        return (
          <Card key={category.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  category.items.length > 0 
                    ? "bg-red-500/30 text-red-400" 
                    : "bg-white/10 text-neutral-400"
                )}>
                  <category.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">
                    {category.name}
                    {category.items.length > 0 && (
                      <span className="ml-2 text-sm text-red-400">
                        ({category.items.length} equipped)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400 font-normal">{category.description}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Render equipped items first */}
                {category.items.map((item, index) => (
                  <LoadoutWeaponCard
                    key={`${item.userConfig.weapon_defindex}-${item.userConfig.weapon_team}-${index}`}
                    item={item}
                    team={team}
                  />
                ))}
                
                {/* Render placeholder items */}
                {category.placeholderItems.map((placeholder, index) => (
                  <LoadoutWeaponCard
                    key={`placeholder-${category.id}-${index}`}
                    placeholder={placeholder}
                    team={team}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
