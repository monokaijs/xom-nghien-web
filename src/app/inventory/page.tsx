'use client';

import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {ArrowUpDown, CheckCircle2, Circle, Plus, Search, Trash2, Edit} from 'lucide-react';
import {cn} from '@/lib/utils';
import {InventoryItem, SortOption} from '@/types/server';
import CraftSkinModal from '@/components/CraftSkinModal';
import EditSkinModal from '@/components/EditSkinModal';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [craftModalOpen, setCraftModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: InventoryItem } | null>(null);

  useEffect(() => {
    fetchInventory();
    checkAndCreateTable();

    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const checkAndCreateTable = async () => {
    try {
      const checkRes = await fetch('/api/setup');
      const checkData = await checkRes.json();

      if (!checkData.tableExists) {
        const createRes = await fetch('/api/setup', {method: 'POST'});
        const createData = await createRes.json();
        if (createData.success) {
          console.log('Inventory table created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking/creating table:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquip = async (item: InventoryItem, team: 2 | 3 | 'both', action: 'equip' | 'unequip') => {
    if (!item.craftedSkin) return;

    try {
      if (team === 'both') {
        await Promise.all([
          fetch('/api/inventory', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: item.craftedSkin.id,
              action,
              team: 2
            })
          }),
          fetch('/api/inventory', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: item.craftedSkin.id,
              action,
              team: 3
            })
          })
        ]);
      } else {
        await fetch('/api/inventory', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: item.craftedSkin.id,
            action,
            team
          })
        });
      }

      await fetchInventory();
      setContextMenu(null);
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!item.craftedSkin || !confirm('Delete this skin from your inventory?')) return;

    try {
      const res = await fetch(`/api/inventory?id=${item.craftedSkin.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchInventory();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter(item =>
      item.weaponName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'equipped':
          const aEquipped = (a.craftedSkin?.equipped_t ? 1 : 0) + (a.craftedSkin?.equipped_ct ? 1 : 0);
          const bEquipped = (b.craftedSkin?.equipped_t ? 1 : 0) + (b.craftedSkin?.equipped_ct ? 1 : 0);
          comparison = bEquipped - aEquipped;
          break;
        case 'time':
          const aTime = a.craftedSkin?.created_at instanceof Date
            ? a.craftedSkin.created_at.toISOString()
            : (a.craftedSkin?.created_at || '');
          const bTime = b.craftedSkin?.created_at instanceof Date
            ? b.craftedSkin.created_at.toISOString()
            : (b.craftedSkin?.created_at || '');
          comparison = aTime.localeCompare(bTime);
          break;
        case 'quality':
          comparison = (a.craftedSkin?.weapon_wear || 1) - (b.craftedSkin?.weapon_wear || 1);
          break;
        case 'alphabetical':
          comparison = a.weaponName.localeCompare(b.weaponName);
          break;
        case 'type':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'collection':
          comparison = 0;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [inventory, searchQuery, sortBy, sortOrder]);

  const wearConditions = [
    {min: 0, max: 0.07, name: 'FN', color: 'bg-green-500'},
    {min: 0.07, max: 0.15, name: 'MW', color: 'bg-blue-500'},
    {min: 0.15, max: 0.38, name: 'FT', color: 'bg-yellow-500'},
    {min: 0.38, max: 0.45, name: 'WW', color: 'bg-orange-500'},
    {min: 0.45, max: 1.0, name: 'BS', color: 'bg-red-500'},
  ];

  const getWearCondition = (wear: number) => {
    return wearConditions.find(c => wear >= c.min && wear < c.max) || wearConditions[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <Button
            onClick={() => setCraftModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2"/>
            Craft New Skin
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4"/>
            <Input
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-400"
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder="Sort by"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipped">Sort: Equipped</SelectItem>
              <SelectItem value="time">Sort: Newest</SelectItem>
              <SelectItem value="quality">Sort: Quality</SelectItem>
              <SelectItem value="alphabetical">Sort: A-Z</SelectItem>
              <SelectItem value="type">Sort: Type</SelectItem>
              <SelectItem value="collection">Sort: Collection</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="border-white/20"
          >
            <ArrowUpDown className="w-4 h-4"/>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-neutral-400 py-12">Loading inventory...</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSortedInventory.map((item, index) => {
              const equippedT = item.craftedSkin?.equipped_t;
              const equippedCT = item.craftedSkin?.equipped_ct;
              const isEquipped = equippedT || equippedCT;
              const wear = item.craftedSkin?.weapon_wear;
              const condition = wear !== undefined ? getWearCondition(wear) : null;

              return (
                <div
                  key={`${item.craftedSkin?.id || item.weaponName}-${index}`}
                  onContextMenu={(e) => {
                    if (!item.isDefault) {
                      e.preventDefault();
                      setContextMenu({x: e.clientX, y: e.clientY, item});
                    }
                  }}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl flex flex-col",
                    "aspect-square",
                    !item.isDefault && "cursor-pointer",
                    isEquipped && "border-green-500/50 bg-green-500/10",
                    item.isDefault && "border-dashed cursor-default"
                  )}
                >
                  <div className="relative overflow-hidden flex-1 rounded-t-xl flex items-center justify-center">
                    <img
                      src={item.skinData?.image || item.gloveData?.image || ''}
                      alt={item.weaponName}
                      className="w-[70%] object-cover"
                    />
                    {item.isDefault && (
                      <Badge className="absolute top-2 right-2 bg-neutral-700 text-white text-xs">
                        Default
                      </Badge>
                    )}
                    {(equippedT || equippedCT) ? (
                      <div className="absolute top-2 left-2 flex gap-1">
                        {equippedT ? (
                          <Badge className="bg-red-500 text-white text-xs">T</Badge>
                        ) : <></>}
                        {equippedCT ? (
                          <Badge className="bg-blue-500 text-white text-xs">CT</Badge>
                        ) : <></>}
                      </div>
                    ) : <></>}
                  </div>

                  <div className="absolute p-4 left-0 right-0 bottom-0 flex flex-col">
                    <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                      {item.craftedSkin?.weapon_stattrak ? 'StatTrak™ ' : ''}<br/>
                      {item.weaponName}
                      {item.craftedSkin?.weapon_nametag && ` "${item.craftedSkin.weapon_nametag}"`}
                    </h3>

                    {condition && (
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", condition.color)}/>
                        <span className="text-xs text-neutral-400">
                          {condition.name} ({wear?.toFixed(3)})
                        </span>
                      </div>
                    )}

                    {!item.isDefault && item.stickers.some(s => s !== null) && (
                      <div className="flex gap-1 mt-2">
                        {item.stickers.map((sticker, idx) => sticker && (
                          <div key={idx} className="w-6 h-6 bg-white/10 rounded border border-white/20">
                            <img src={sticker.image} alt={sticker.name} className="w-full h-full object-contain p-0.5" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!item.isDefault && item.keychain && (
                      <div className="absolute right-4 top-4">
                        <div className="w-6 h-6 bg-white/10 rounded border border-white/20">
                          <img src={item.keychain.image} alt={item.keychain.name} className="w-full h-full object-contain p-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CraftSkinModal
        open={craftModalOpen}
        onClose={() => setCraftModalOpen(false)}
        onSkinCrafted={fetchInventory}
      />

      {contextMenu && (
        <div
          className="fixed bg-black/95 border border-white/20 rounded-lg shadow-lg py-2 z-50 min-w-[180px]"
          style={{top: contextMenu.y, left: contextMenu.x}}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs text-neutral-400 border-b border-white/10">
            {contextMenu.item.weaponName}
          </div>

          <button
            onClick={() => handleEquip(contextMenu.item, 2, contextMenu.item.craftedSkin?.equipped_t ? 'unequip' : 'equip')}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            {contextMenu.item.craftedSkin?.equipped_t ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-red-500"/>
                Unequip T Side
              </>
            ) : (
              <>
                <Circle className="w-4 h-4"/>
                Equip T Side
              </>
            )}
          </button>

          <button
            onClick={() => handleEquip(contextMenu.item, 3, contextMenu.item.craftedSkin?.equipped_ct ? 'unequip' : 'equip')}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            {contextMenu.item.craftedSkin?.equipped_ct ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-500"/>
                Unequip CT Side
              </>
            ) : (
              <>
                <Circle className="w-4 h-4"/>
                Equip CT Side
              </>
            )}
          </button>

          <button
            onClick={() => {
              const bothEquipped = contextMenu.item.craftedSkin?.equipped_t && contextMenu.item.craftedSkin?.equipped_ct;
              handleEquip(contextMenu.item, 'both', bothEquipped ? 'unequip' : 'equip');
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            {contextMenu.item.craftedSkin?.equipped_t && contextMenu.item.craftedSkin?.equipped_ct ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500"/>
                Unequip Both Sides
              </>
            ) : (
              <>
                <Circle className="w-4 h-4"/>
                Equip Both Sides
              </>
            )}
          </button>

          <div className="border-t border-white/10 my-1"/>

          <button
            onClick={() => {
              setEditingItem(contextMenu.item);
              setEditModalOpen(true);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            <Edit className="w-4 h-4"/>
            Edit
          </button>

          <button
            onClick={() => handleDelete(contextMenu.item)}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4"/>
            Delete Skin
          </button>
        </div>
      )}

      <EditSkinModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        onSkinUpdated={fetchInventory}
        item={editingItem}
      />
    </div>
  );
}

