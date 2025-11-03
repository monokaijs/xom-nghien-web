'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Target, Sparkles, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItem, CS2Sticker, CS2Keychain } from '@/types/server';
import StickerModal from '@/components/StickerModal';
import KeychainModal from '@/components/KeychainModal';

interface EditSkinModalProps {
  open: boolean;
  onClose: () => void;
  onSkinUpdated: () => void;
  item: InventoryItem | null;
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500' },
];

export default function EditSkinModal({ open, onClose, onSkinUpdated, item }: EditSkinModalProps) {
  const [wear, setWear] = useState(0.1);
  const [seed, setSeed] = useState(1);
  const [nameTag, setNameTag] = useState('');
  const [statTrak, setStatTrak] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<(CS2Sticker | null)[]>([null, null, null, null, null]);
  const [selectedKeychain, setSelectedKeychain] = useState<CS2Keychain | null>(null);
  const [stickers, setStickers] = useState<CS2Sticker[]>([]);
  const [keychains, setKeychains] = useState<CS2Keychain[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [keychainModalOpen, setKeychainModalOpen] = useState(false);

  useEffect(() => {
    if (open && item?.craftedSkin) {
      setWear(item.craftedSkin.weapon_wear);
      setSeed(item.craftedSkin.weapon_seed);
      setNameTag(item.craftedSkin.weapon_nametag || '');
      setStatTrak(item.craftedSkin.weapon_stattrak === 1);
      setSelectedStickers(item.stickers || [null, null, null, null, null]);
      setSelectedKeychain(item.keychain || null);
      fetchData();
    }
  }, [open, item]);

  const fetchData = async () => {
    try {
      const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';
      const [stickersRes, keychainsRes] = await Promise.all([
        fetch(`${GITHUB_RAW_BASE}/stickers.json`),
        fetch(`${GITHUB_RAW_BASE}/keychains.json`)
      ]);
      const stickersData = await stickersRes.json();
      const keychainsData = await keychainsRes.json();
      setStickers(stickersData);
      setKeychains(keychainsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSave = async () => {
    if (!item?.craftedSkin) return;

    setIsSaving(true);
    try {
      const formatSticker = (sticker: CS2Sticker | null) => {
        return sticker ? `${sticker.id};0;0;0;0;0;0` : '0';
      };

      const payload = {
        id: item.craftedSkin.id,
        weapon_wear: wear,
        weapon_seed: seed,
        weapon_nametag: nameTag,
        weapon_stattrak: statTrak ? 1 : 0,
        weapon_sticker_0: formatSticker(selectedStickers[0]),
        weapon_sticker_1: formatSticker(selectedStickers[1]),
        weapon_sticker_2: formatSticker(selectedStickers[2]),
        weapon_sticker_3: formatSticker(selectedStickers[3]),
        weapon_sticker_4: formatSticker(selectedStickers[4]),
        weapon_keychain: selectedKeychain ? `${selectedKeychain.id};0;0;0;0` : '0'
      };

      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onClose();
        onSkinUpdated();
      } else {
        alert('Failed to update skin');
      }
    } catch (error) {
      console.error('Error updating skin:', error);
      alert('Error updating skin');
    } finally {
      setIsSaving(false);
    }
  };

  if (!item?.craftedSkin) return null;

  const isGlove = item.category === 'gloves';
  const itemName = item.weaponName;
  const itemImage = item.skinData?.image || item.gloveData?.image || '';
  const currentCondition = wearConditions.find(c => wear >= c.min && wear < c.max) || wearConditions[0];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-auto max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-400" />
            Edit Skin
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {statTrak && !isGlove && (
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
                    {statTrak && !isGlove ? 'StatTrak™ ' : ''}{itemName}
                  </h3>
                  {nameTag && (
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      "{nameTag}"
                    </div>
                  )}
                  <div className="text-sm text-neutral-400">
                    Wear: {wear.toFixed(4)} • Seed: {seed}
                  </div>
                </div>

                {!isGlove && selectedStickers.some(s => s !== null) && (
                  <div className="mt-4">
                    <Label className="text-white text-sm mb-2 block">Stickers</Label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedStickers.map((sticker, idx) => sticker && (
                        <div key={idx} className="relative w-12 h-12 bg-white/5 rounded border border-white/10">
                          <img src={sticker.image} alt={sticker.name} className="w-full h-full object-contain p-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isGlove && selectedKeychain && (
                  <div className="mt-4">
                    <Label className="text-white text-sm mb-2 block">Keychain</Label>
                    <div className="relative w-12 h-12 bg-white/5 rounded border border-white/10">
                      <img src={selectedKeychain.image} alt={selectedKeychain.name} className="w-full h-full object-contain p-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!isGlove && (
              <>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Wear Float</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Slider
                      value={[wear]}
                      onValueChange={(v) => setWear(v[0])}
                      min={0}
                      max={1}
                      step={0.0001}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Factory New</span>
                      <span>Battle-Scarred</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Pattern Seed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Slider
                      value={[seed]}
                      onValueChange={(v) => setSeed(v[0])}
                      min={0}
                      max={1000}
                      step={1}
                      className="w-full"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Name Tag</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={nameTag}
                      onChange={(e) => setNameTag(e.target.value.slice(0, 20))}
                      placeholder="Enter custom name..."
                      maxLength={20}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">StatTrak™</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Switch checked={statTrak} onCheckedChange={setStatTrak} />
                      <Label className="text-neutral-300">Enable StatTrak™</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Stickers & Keychain</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => setStickerModalOpen(true)}
                      variant="outline"
                      className="w-full border-white/20 justify-between"
                    >
                      <span>Stickers ({selectedStickers.filter((s: CS2Sticker | null) => s !== null).length}/5)</span>
                      <Package className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setKeychainModalOpen(true)}
                      variant="outline"
                      className="w-full border-white/20 justify-between"
                    >
                      <span>{selectedKeychain ? selectedKeychain.name : 'No Keychain'}</span>
                      <Package className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/20"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <StickerModal
      open={stickerModalOpen}
      onClose={() => setStickerModalOpen(false)}
      stickers={stickers}
      selectedStickers={selectedStickers}
      onSave={setSelectedStickers}
    />

    <KeychainModal
      open={keychainModalOpen}
      onClose={() => setKeychainModalOpen(false)}
      keychains={keychains}
      selectedKeychain={selectedKeychain}
      onSave={setSelectedKeychain}
    />
    </>
  );
}

