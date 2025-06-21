'use client';

import { cn } from '@/lib/utils';
import {
  User,
  Hand,
  Sword,
  Target,
  Zap,
  Bomb,
  Crosshair,
  Shield,
  Music,
  Package
} from 'lucide-react';

export type SkinCategory =
  | 'loadout'
  | 'agents'
  | 'gloves'
  | 'knives'
  | 'pistols'
  | 'rifles'
  | 'smg'
  | 'machineguns'
  | 'snipers'
  | 'shotguns'
  | 'music';

interface CategoryItem {
  id: SkinCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const categories: CategoryItem[] = [
  {
    id: 'loadout',
    name: 'My Loadout',
    icon: Package,
    description: 'Your customized weapons and agents',
  },
  {
    id: 'agents',
    name: 'Agents',
    icon: User,
    description: 'Player models for T and CT sides',
  },
  {
    id: 'gloves',
    name: 'Gloves',
    icon: Hand,
    description: 'Hand wraps and glove skins',
  },
  {
    id: 'knives',
    name: 'Knives',
    icon: Sword,
    description: 'Melee weapons and knife skins',
  },
  {
    id: 'pistols',
    name: 'Pistols',
    icon: Target,
    description: 'Secondary weapons',
  },
  {
    id: 'rifles',
    name: 'Rifles',
    icon: Target,
    description: 'Primary assault rifles',
  },
  {
    id: 'smg',
    name: 'SMG',
    icon: Zap,
    description: 'Submachine guns',
  },
  {
    id: 'machineguns',
    name: 'Machine Guns',
    icon: Bomb,
    description: 'Heavy machine guns',
  },
  {
    id: 'snipers',
    name: 'Sniper Rifles',
    icon: Crosshair,
    description: 'Long-range precision weapons',
  },
  {
    id: 'shotguns',
    name: 'Shotguns',
    icon: Shield,
    description: 'Close-range weapons',
  },
  {
    id: 'music',
    name: 'Music Kits',
    icon: Music,
    description: 'MVP music and sound effects',
  },
];

interface CategoryNavigationProps {
  activeCategory: SkinCategory;
  onCategoryChange: (category: SkinCategory) => void;
  className?: string;
}

export default function CategoryNavigation({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryNavigationProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h2 className="text-lg font-semibold text-white mb-4 px-3">Categories</h2>

      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
              'text-left hover:bg-white/10 border',
              isActive
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'text-neutral-300 border-transparent hover:text-white'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isActive
                ? 'bg-red-500/30 text-red-400'
                : 'bg-white/10 text-neutral-400'
            )}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{category.name}</div>
              <div className="text-xs text-neutral-400 truncate">
                {category.description}
              </div>
            </div>

            {isActive && (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { categories };
