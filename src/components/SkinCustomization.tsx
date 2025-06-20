'use client';

import { useState } from 'react';
import { CS2Skin, CS2Agent } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Settings, Target, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkinCustomizationProps {
  skin?: CS2Skin;
  agent?: CS2Agent;
  isOpen: boolean;
  onClose: () => void;
  selectedTeam: 2 | 3;
}

interface CustomizationSettings {
  wear: number;
  seed: number;
  nameTag: string;
  statTrak: boolean;
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500' },
];

export default function SkinCustomization({
  skin,
  agent,
  isOpen,
  onClose,
  selectedTeam,
}: SkinCustomizationProps) {
  const [settings, setSettings] = useState<CustomizationSettings>({
    wear: 0.1,
    seed: 1,
    nameTag: '',
    statTrak: false,
  });

  const [imageError, setImageError] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const getWearCondition = (wear: number) => {
    return wearConditions.find(condition => wear >= condition.min && wear < condition.max) || wearConditions[0];
  };

  const currentCondition = getWearCondition(settings.wear);

  const handleWearChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, wear: value[0] }));
  };

  const handleSeedChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, seed: value[0] }));
  };

  const handleNameTagChange = (value: string) => {
    setSettings(prev => ({ ...prev, nameTag: value }));
  };

  const handleStatTrakToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, statTrak: checked }));
  };

  const handleApply = async () => {
    if (!skin && !agent) return;

    setIsApplying(true);
    try {
      const payload = {
        type: skin ? (skin.weapon_name.includes('knife') ? 'knifes' : 'weapons') : 'agents',
        weapon_team: selectedTeam,
        weapon_defindex: skin ? skin.weapon_defindex : agent?.model,
        weapon_paint_id: skin ? skin.paint : agent?.model,
        weapon_wear: settings.wear,
        weapon_seed: settings.seed,
        weapon_nametag: settings.nameTag,
        weapon_stattrak: settings.statTrak ? 1 : 0,
        weapon_sticker_0: '0',
        weapon_sticker_1: '0',
        weapon_sticker_2: '0',
        weapon_sticker_3: '0',
        weapon_sticker_4: '0',
        weapon_keychain: '0',
      };

      const response = await fetch('/api/apply-skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Skin applied successfully:', result);
        onClose();
      } else {
        const error = await response.json();
        console.error('Failed to apply skin:', error);
        alert('Failed to apply skin configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error applying skin:', error);
      alert('An error occurred while applying the skin configuration.');
    } finally {
      setIsApplying(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      wear: 0.1,
      seed: 1,
      nameTag: '',
      statTrak: false,
    });
  };

  if (!skin && !agent) return null;

  const item = skin || agent;
  const itemName = skin ? skin.paint_name : agent?.agent_name || '';
  const itemImage = skin ? skin.image : agent?.image || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-400" />
            Customize {skin ? 'Weapon' : 'Agent'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Section */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-4">
                  {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                      <Target className="w-12 h-12 mb-2" />
                      <span>Image not available</span>
                    </div>
                  ) : (
                    <img
                      src={itemImage}
                      alt={itemName}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  )}
                  
                  {/* Overlay with condition and StatTrak */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {settings.statTrak && skin && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
                        StatTrak™
                      </Badge>
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3">
                    <Badge className={cn('text-white', currentCondition.color)}>
                      {currentCondition.name}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">
                    {settings.statTrak && skin ? 'StatTrak™ ' : ''}{itemName}
                  </h3>
                  {settings.nameTag && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      "{settings.nameTag}"
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Team: {selectedTeam === 2 ? 'Terrorist' : 'Counter-Terrorist'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customization Controls */}
          <div className="space-y-6">
            {skin && (
              <>
                {/* Wear Condition */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Wear Condition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-gray-300">Float Value</Label>
                        <span className="text-white font-mono text-sm">
                          {settings.wear.toFixed(4)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.wear]}
                        onValueChange={handleWearChange}
                        min={0}
                        max={0.99}
                        step={0.001}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {wearConditions.map((condition) => (
                        <button
                          key={condition.name}
                          onClick={() => setSettings(prev => ({ 
                            ...prev, 
                            wear: (condition.min + condition.max) / 2 
                          }))}
                          className={cn(
                            'p-2 rounded text-xs font-medium transition-all',
                            'border border-white/10 hover:border-white/20',
                            currentCondition.name === condition.name
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          )}
                        >
                          {condition.name}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Seed */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Pattern Seed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-gray-300">Seed</Label>
                        <span className="text-white font-mono text-sm">
                          {settings.seed}
                        </span>
                      </div>
                      <Slider
                        value={[settings.seed]}
                        onValueChange={handleSeedChange}
                        min={1}
                        max={1000}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 500, 1000].map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setSettings(prev => ({ ...prev, seed }))}
                          className="p-2 rounded text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          {seed}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Name Tag */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Name Tag</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Custom Name</Label>
                      <Input
                        value={settings.nameTag}
                        onChange={(e) => handleNameTagChange(e.target.value)}
                        placeholder="Enter custom name..."
                        maxLength={20}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                      <div className="text-xs text-gray-400">
                        {settings.nameTag.length}/20 characters
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* StatTrak */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">StatTrak™</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-300">Enable StatTrak™</Label>
                        <p className="text-sm text-gray-400">Track your kills with this weapon</p>
                      </div>
                      <Switch
                        checked={settings.statTrak}
                        onCheckedChange={handleStatTrakToggle}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </Button>
              <Button
                onClick={resetSettings}
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                Reset
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
