'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronLeft, Target, Settings, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CS2Skin, CS2Glove, CS2Sticker, CS2Keychain } from '@/types/server';
import StickerSelector from '@/components/StickerSelector';
import KeychainSelector from '@/components/KeychainSelector';

interface CraftSkinModalProps {
  open: boolean;
  onClose: () => void;
  onSkinCrafted: () => void;
}

type Category = 'pistols' | 'rifles' | 'smg' | 'shotguns' | 'snipers' | 'machineguns' | 'knives' | 'gloves';

interface CategoryConfig {
  id: Category;
  name: string;
  defindexRanges?: number[][];
  weaponNames?: string[];
}

const categories: CategoryConfig[] = [
  { id: 'pistols', name: 'Pistols', defindexRanges: [[1, 4], [30, 32], [61, 64]] },
  { id: 'rifles', name: 'Rifles', defindexRanges: [[7, 10], [13, 13], [16, 16], [39, 39], [60, 60]] },
  { id: 'smg', name: 'SMGs', defindexRanges: [[17, 19], [23, 26], [33, 34]] },
  { id: 'shotguns', name: 'Shotguns', defindexRanges: [[25, 29], [35, 35]] },
  { id: 'snipers', name: 'Sniper Rifles', defindexRanges: [[9, 9], [11, 11], [38, 38]] },
  { id: 'machineguns', name: 'Machine Guns', defindexRanges: [[14, 14], [28, 28]] },
  { id: 'knives', name: 'Knives', weaponNames: ['knife', 'bayonet'] },
  { id: 'gloves', name: 'Gloves', weaponNames: ['glove'] },
];

export default function CraftSkinModal({ open, onClose, onSkinCrafted }: CraftSkinModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<CS2Skin | CS2Glove | null>(null);
  const [selectedSkin, setSelectedSkin] = useState<CS2Skin | CS2Glove | null>(null);
  const [skins, setSkins] = useState<CS2Skin[]>([]);
  const [gloves, setGloves] = useState<CS2Glove[]>([]);
  const [stickers, setStickers] = useState<CS2Sticker[]>([]);
  const [keychains, setKeychains] = useState<CS2Keychain[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);

  const [wear, setWear] = useState(0.1);
  const [seed, setSeed] = useState(1);
  const [nameTag, setNameTag] = useState('');
  const [statTrak, setStatTrak] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<(CS2Sticker | null)[]>([null, null, null, null, null]);
  const [selectedKeychain, setSelectedKeychain] = useState<CS2Keychain | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setSelectedCategory(null);
      setSelectedWeapon(null);
      setSelectedSkin(null);
      setSearchQuery('');
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src/data';
      const [skinsRes, glovesRes, stickersRes, keychainsRes] = await Promise.all([
        fetch(`${GITHUB_RAW_BASE}/skins.json`),
        fetch(`${GITHUB_RAW_BASE}/gloves.json`),
        fetch(`${GITHUB_RAW_BASE}/stickers.json`),
        fetch(`${GITHUB_RAW_BASE}/keychains.json`)
      ]);
      const skinsData = await skinsRes.json();
      const glovesData = await glovesRes.json();
      const stickersData = await stickersRes.json();
      const keychainsData = await keychainsRes.json();
      setSkins(skinsData);
      setGloves(glovesData);
      setStickers(stickersData);
      setKeychains(keychainsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weaponsInCategory = useMemo(() => {
    if (!selectedCategory) return [];

    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return [];

    if (selectedCategory === 'gloves') {
      return gloves;
    }

    if (selectedCategory === 'knives') {
      return skins.filter(skin =>
        skin.weapon_name.toLowerCase().includes('knife') ||
        skin.weapon_name.toLowerCase().includes('bayonet') ||
        skin.weapon_name.toLowerCase().includes('karambit')
      );
    }

    return skins.filter(skin => {
      if (category.defindexRanges) {
        return category.defindexRanges.some(([min, max]) =>
          skin.weapon_defindex >= min && skin.weapon_defindex <= max
        );
      }
      return false;
    });
  }, [selectedCategory, skins, gloves]);

  const uniqueWeapons = useMemo(() => {
    if (selectedCategory === 'gloves') {
      return gloves;
    }

    const weaponMap = new Map<string, CS2Skin>();
    weaponsInCategory.forEach(weapon => {
      if ('weapon_name' in weapon && weapon.weapon_name) {
        const key = weapon.weapon_name;
        if (!weaponMap.has(key)) {
          weaponMap.set(key, weapon as CS2Skin);
        }
      }
    });
    return Array.from(weaponMap.values());
  }, [weaponsInCategory, selectedCategory, gloves]);

  const skinsForWeapon = useMemo(() => {
    if (!selectedWeapon) return [];

    if (selectedCategory === 'gloves') {
      return gloves;
    }

    const weaponName = (selectedWeapon as CS2Skin).weapon_name;
    return skins.filter(s => s.weapon_name === weaponName);
  }, [selectedWeapon, skins, gloves, selectedCategory]);

  const filteredItems = useMemo(() => {
    const items = selectedWeapon ? skinsForWeapon : uniqueWeapons;
    if (!searchQuery) return items;

    return items.filter(item => {
      if ('paint_name' in item) {
        return item.paint_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.weapon_name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });
  }, [selectedWeapon, skinsForWeapon, uniqueWeapons, searchQuery]);

  const handleWeaponSelect = (weapon: CS2Skin | CS2Glove) => {
    setSelectedWeapon(weapon);
    setSearchQuery('');
  };

  const handleSkinSelect = (skin: CS2Skin | CS2Glove) => {
    setSelectedSkin(skin);
    setCustomizeModalOpen(true);
  };

  const handleCustomizationSave = async () => {
    if (!selectedSkin) return;

    setIsSaving(true);
    try {
      const formatSticker = (sticker: CS2Sticker | null) => {
        return sticker ? `${sticker.id};0;0;0;0;0;0` : '0';
      };

      const payload = {
        weapon_defindex: selectedSkin.weapon_defindex,
        weapon_paint_id: selectedSkin.paint,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCustomizeModalOpen(false);
        onClose();
        onSkinCrafted();

        setWear(0.1);
        setSeed(1);
        setNameTag('');
        setStatTrak(false);
        setSelectedStickers([null, null, null, null, null]);
        setSelectedKeychain(null);
      } else {
        alert('Failed to save skin');
      }
    } catch (error) {
      console.error('Error saving skin:', error);
      alert('Error saving skin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (selectedWeapon) {
      setSelectedWeapon(null);
      setSearchQuery('');
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-auto w-6xl max-h-[90vh] bg-black/95 border-white/10 p-0 overflow-hidden">
        <div className="flex h-[85vh]">
          <div className="w-64 border-r border-white/10 p-6 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold text-white">Categories</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedWeapon(null);
                    setSearchQuery('');
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-all",
                    selectedCategory === category.id
                      ? "bg-red-500 text-white"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {(selectedCategory || selectedWeapon) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <h2 className="text-xl font-semibold text-white">
                  {selectedWeapon
                    ? selectedWeapon.weapon_name || 'Gloves'
                    : selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : 'Select a category'}
                </h2>
              </div>

              {selectedCategory && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    placeholder={selectedWeapon ? "Search skins..." : "Search weapons..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!selectedCategory ? (
                <div className="flex items-center justify-center h-full text-neutral-400">
                  Select a category to view weapons
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full text-neutral-400">
                  Loading...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-neutral-400">
                  No items found
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item, index) => {
                    const name = item.paint_name;
                    const image = item.image;
                    const weaponName = item.weapon_name || 'Gloves';

                    return (
                      <div
                        key={`${name}-${index}`}
                        onClick={() => selectedWeapon ? handleSkinSelect(item) : handleWeaponSelect(item)}
                        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                                  <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span class="text-sm">No image</span>
                                </div>
                              `;
                            }}
                          />
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 h-[2rem] leading-tight">
                            {name}
                          </h3>
                          {!selectedWeapon && (
                            <span className="text-xs text-neutral-400 mt-auto">
                              {weaponName}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {selectedSkin && (
        <CustomizationDialog
          open={customizeModalOpen}
          onClose={() => setCustomizeModalOpen(false)}
          skin={selectedSkin}
          wear={wear}
          setWear={setWear}
          seed={seed}
          setSeed={setSeed}
          nameTag={nameTag}
          setNameTag={setNameTag}
          statTrak={statTrak}
          setStatTrak={setStatTrak}
          selectedStickers={selectedStickers}
          setSelectedStickers={setSelectedStickers}
          selectedKeychain={selectedKeychain}
          setSelectedKeychain={setSelectedKeychain}
          stickers={stickers}
          keychains={keychains}
          onSave={handleCustomizationSave}
          isSaving={isSaving}
        />
      )}
    </Dialog>
  );
}

const wearConditions = [
  { min: 0, max: 0.07, name: 'Factory New', color: 'bg-green-500' },
  { min: 0.07, max: 0.15, name: 'Minimal Wear', color: 'bg-blue-500' },
  { min: 0.15, max: 0.38, name: 'Field-Tested', color: 'bg-yellow-500' },
  { min: 0.38, max: 0.45, name: 'Well-Worn', color: 'bg-orange-500' },
  { min: 0.45, max: 1.0, name: 'Battle-Scarred', color: 'bg-red-500' },
];

function CustomizationDialog({
  open,
  onClose,
  skin,
  wear,
  setWear,
  seed,
  setSeed,
  nameTag,
  setNameTag,
  statTrak,
  setStatTrak,
  selectedStickers,
  setSelectedStickers,
  selectedKeychain,
  setSelectedKeychain,
  stickers,
  keychains,
  onSave,
  isSaving
}: any) {
  const [imageError, setImageError] = useState(false);
  const isSkin = 'weapon_defindex' in skin;
  const itemName = 'paint_name' in skin ? skin.paint_name : skin.name;
  const itemImage = skin.image || '';
  const currentCondition = wearConditions.find(c => wear >= c.min && wear < c.max) || wearConditions[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-auto max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-400" />
            Customize Skin
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

                  {statTrak && isSkin && (
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
                    {statTrak && isSkin ? 'StatTrak™ ' : ''}{itemName}
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {isSkin && (
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
                onClick={onSave}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save to Inventory'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

