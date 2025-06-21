'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { CS2Skin, CS2Agent, CS2Sticker, CS2Keychain } from '@/types/server';
import StickerSelector from '@/components/StickerSelector';
import KeychainSelector from '@/components/KeychainSelector';
import WeaponPreview from '@/components/WeaponPreview';

interface CustomizationSettings {
  wear: number;
  seed: number;
  nameTag: string;
  statTrak: boolean;
  stickers: (CS2Sticker | null)[];
  keychain: CS2Keychain | null;
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500' },
];

function WeaponCustomizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Get weapon data from URL params
  const weaponData = searchParams.get('weapon');
  const agentData = searchParams.get('agent');
  const selectedTeam = parseInt(searchParams.get('team') || '2') as 2 | 3;

  const [skin, setSkin] = useState<CS2Skin | null>(null);
  const [agent, setAgent] = useState<CS2Agent | null>(null);
  const [settings, setSettings] = useState<CustomizationSettings>({
    wear: 0.1,
    seed: 1,
    nameTag: '',
    statTrak: false,
    stickers: [null, null, null, null, null],
    keychain: null,
  });

  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (weaponData) {
      try {
        const parsedSkin = JSON.parse(decodeURIComponent(weaponData));
        setSkin(parsedSkin);
      } catch (error) {
        console.error('Error parsing weapon data:', error);
        router.push('/skin-changer');
      }
    } else if (agentData) {
      try {
        const parsedAgent = JSON.parse(decodeURIComponent(agentData));
        setAgent(parsedAgent);
      } catch (error) {
        console.error('Error parsing agent data:', error);
        router.push('/skin-changer');
      }
    } else {
      router.push('/skin-changer');
    }
  }, [weaponData, agentData, router]);

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

  const handleStickerSelect = (index: number, sticker: CS2Sticker | null) => {
    setSettings(prev => {
      const newStickers = [...prev.stickers];
      newStickers[index] = sticker;
      return { ...prev, stickers: newStickers };
    });
  };

  const handleKeychainSelect = (keychain: CS2Keychain | null) => {
    setSettings(prev => ({ ...prev, keychain }));
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
        weapon_sticker_0: settings.stickers[0]?.id || '0',
        weapon_sticker_1: settings.stickers[1]?.id || '0',
        weapon_sticker_2: settings.stickers[2]?.id || '0',
        weapon_sticker_3: settings.stickers[3]?.id || '0',
        weapon_sticker_4: settings.stickers[4]?.id || '0',
        weapon_keychain: settings.keychain?.id || '0',
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
        router.push('/skin-changer');
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
      stickers: [null, null, null, null, null],
      keychain: null,
    });
  };

  if (!skin && !agent) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p>Please wait while we load your weapon data.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const item = skin || agent;
  const itemName = skin ? skin.paint_name : agent?.agent_name || '';
  const itemImage = skin ? skin.image : agent?.image || '';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => router.push('/skin-changer')}
              variant="ghost"
              size="sm"
              className="text-neutral-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Skin Changer
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Preview and Basic Settings */}
            <div className="space-y-6">
              {/* Weapon Preview */}
              <WeaponPreview
                item={item!}
                settings={settings}
                itemName={itemName}
                itemImage={itemImage}
              />

              {/* Basic Customization */}
              {skin && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Basic Customization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Wear Float */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-neutral-300">Wear Float</Label>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${currentCondition.color}`} />
                          <span className="text-sm text-neutral-300">{currentCondition.name}</span>
                          <span className="text-sm text-neutral-400">({settings.wear.toFixed(3)})</span>
                        </div>
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

                    {/* Seed */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-neutral-300">Pattern Seed</Label>
                        <span className="text-sm text-neutral-400">{settings.seed}</span>
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

                    {/* Name Tag */}
                    <div className="space-y-2">
                      <Label className="text-neutral-300">Name Tag</Label>
                      <Input
                        value={settings.nameTag}
                        onChange={(e) => setSettings(prev => ({ ...prev, nameTag: e.target.value }))}
                        placeholder="Enter custom name..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
                        maxLength={20}
                      />
                    </div>

                    {/* StatTrak */}
                    <div className="flex items-center justify-between">
                      <Label className="text-neutral-300">StatTrak™</Label>
                      <Switch
                        checked={settings.statTrak}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, statTrak: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Stickers and Keychains */}
            <div className="space-y-6">
              {/* Sticker Selection */}
              {skin && (
                <StickerSelector
                  selectedStickers={settings.stickers}
                  onStickerSelect={handleStickerSelect}
                />
              )}

              {/* Keychain Selection */}
              {skin && (
                <KeychainSelector
                  selectedKeychain={settings.keychain}
                  onKeychainSelect={handleKeychainSelect}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isApplying ? 'Applying...' : 'Apply Configuration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function WeaponCustomizePage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p>Please wait while we load your weapon data.</p>
          </div>
        </div>
      </ProtectedRoute>
    }>
      <WeaponCustomizeContent />
    </Suspense>
  );
}
