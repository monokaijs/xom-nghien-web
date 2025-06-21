'use client';

import {useState} from 'react';
import {CS2Skin} from '@/types/server';
import {Button} from '@/components/ui/button';
import {Star, Target} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Card, CardContent} from './ui/card';

interface SkinCardProps {
  skin: CS2Skin;
  onCustomize?: (skin: CS2Skin) => void;
  team?: number; // 2 for T, 3 for CT
}

export default function SkinCard({skin, onCustomize, team = 2}: SkinCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize(skin);
    }
  };

  const getRarityColor = () => {
    // Simple rarity detection based on paint name
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

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border-white/10 backdrop-blur-sm pb-0"
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageError ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
              <Target className="w-8 h-8 mb-2"/>
              <span className="text-sm">Image not available</span>
            </div>
          ) : (
            <img
              src={skin.image}
              alt={skin.paint_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

          {/* Rarity Indicator */}
          <div className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-gradient-to-br', getRarityColor()
          )}>
            <Star className="w-4 h-4 text-white"/>
          </div>


        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 h-[2rem] leading-tight">
            {skin.paint_name}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {skin.legacy_model ? 'Legacy' : 'Updated'}
            </span>

            <Button
              size="sm"
              onClick={handleCustomize}
              className="text-xs px-3 py-1 h-7 bg-white/10 hover:bg-red-500 text-white"
            >
              Customize
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
