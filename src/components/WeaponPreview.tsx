'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CS2Skin, CS2Agent, CS2Sticker, CS2Keychain } from '@/types/server';

interface CustomizationSettings {
  wear: number;
  seed: number;
  nameTag: string;
  statTrak: boolean;
  stickers: (CS2Sticker | null)[];
  keychain: CS2Keychain | null;
}

interface WeaponPreviewProps {
  item: CS2Skin | CS2Agent;
  settings: CustomizationSettings;
  itemName: string;
  itemImage: string;
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500' },
];

export default function WeaponPreview({ item, settings, itemName, itemImage }: WeaponPreviewProps) {
  const [imageError, setImageError] = useState(false);

  const isSkin = 'weapon_defindex' in item;
  const getWearCondition = (wear: number) => {
    return wearConditions.find(condition => wear >= condition.min && wear < condition.max) || wearConditions[0];
  };

  const currentCondition = getWearCondition(settings.wear);

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Item Image */}
        <div className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg overflow-hidden border border-white/10">
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
              <div className="text-4xl mb-2">🔫</div>
              <span className="text-sm">Image not available</span>
            </div>
          ) : (
            <img
              src={itemImage}
              alt={itemName}
              className="w-full h-full object-contain p-4"
              onError={() => setImageError(true)}
            />
          )}

          {/* StatTrak Counter Overlay */}
          {isSkin && settings.statTrak && (
            <div className="absolute top-4 left-4 bg-orange-500/90 text-white px-2 py-1 rounded text-xs font-mono">
              StatTrak™ Kills: 0
            </div>
          )}

          {/* Name Tag Overlay */}
          {settings.nameTag && (
            <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-2 py-1 rounded text-xs max-w-32 truncate">
              "{settings.nameTag}"
            </div>
          )}
        </div>

        {/* Item Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isSkin && settings.statTrak && 'StatTrak™ '}
              {itemName}
              {settings.nameTag && ` "${settings.nameTag}"`}
            </h3>
            
            {isSkin && (
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${currentCondition.color}`} />
                <span className="text-sm text-neutral-300">{currentCondition.name}</span>
                <span className="text-sm text-neutral-400">({settings.wear.toFixed(3)})</span>
              </div>
            )}

            <div className="text-sm text-neutral-400">
              {isSkin ? (item as CS2Skin).weapon_name : 'Agent'}
              {isSkin && ` • Pattern: ${settings.seed}`}
            </div>
          </div>

          {/* Stickers Preview */}
          {isSkin && settings.stickers.some(s => s !== null) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-300">Applied Stickers</h4>
              <div className="flex gap-2 flex-wrap">
                {settings.stickers.map((sticker, index) => 
                  sticker ? (
                    <div key={index} className="relative group">
                      <div className="w-12 h-12 bg-white/5 border border-white/20 rounded-md overflow-hidden">
                        <img
                          src={sticker.image}
                          alt={sticker.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {sticker.name}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Keychain Preview */}
          {isSkin && settings.keychain && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-300">Applied Keychain</h4>
              <div className="relative group inline-block">
                <div className="w-12 h-12 bg-white/5 border border-white/20 rounded-md overflow-hidden">
                  <img
                    src={settings.keychain.image}
                    alt={settings.keychain.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {settings.keychain.name}
                </div>
              </div>
            </div>
          )}

          {/* Configuration Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-300">Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {isSkin && (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Wear:</span>
                    <span className="text-white">{settings.wear.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Seed:</span>
                    <span className="text-white">{settings.seed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">StatTrak:</span>
                    <span className="text-white">{settings.statTrak ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Stickers:</span>
                    <span className="text-white">{settings.stickers.filter(s => s !== null).length}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Keychain:</span>
                    <span className="text-white">{settings.keychain ? 'Yes' : 'No'}</span>
                  </div>
                </>
              )}
              {settings.nameTag && (
                <div className="flex justify-between col-span-2">
                  <span className="text-neutral-400">Name Tag:</span>
                  <span className="text-white truncate ml-2">"{settings.nameTag}"</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
