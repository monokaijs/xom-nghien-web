'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import CategoryNavigation, {SkinCategory} from '@/components/CategoryNavigation';
import SearchAndFilter from '@/components/SearchAndFilter';
import SkinGrid from '@/components/SkinGrid';
import Pagination from '@/components/Pagination';
import LoadoutWeaponCard from '@/components/LoadoutWeaponCard';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {CS2Agent, CS2Glove, CS2Skin, UserSkinConfig} from '@/types/server';
import {Grid, LogOut} from 'lucide-react';
import {
  extractUniqueWeapons,
  fetchAgentsData,
  fetchGlovesData,
  fetchSkinsData,
  getGlovesForWeapon,
  getSkinsForWeapon,
  WeaponType
} from '@/lib/github-data';
import WeaponSelector from '@/components/WeaponSelector';
import WeaponSkinsGrid from '@/components/WeaponSkinsGrid';

export default function SkinChangerPage() {
  return (
    <ProtectedRoute>
      <SkinChangerDashboard/>
    </ProtectedRoute>
  );
}

function SkinChangerDashboard() {
  const {user, logout} = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<SkinCategory>('loadout');
  const [skins, setSkins] = useState<CS2Skin[]>([]);
  const [agents, setAgents] = useState<{ terrorist: CS2Agent[]; counterTerrorist: CS2Agent[] }>({
    terrorist: [],
    counterTerrorist: [],
  });
  const [weapons, setWeapons] = useState<WeaponType[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | null>(null);
  const [weaponSkins, setWeaponSkins] = useState<(CS2Skin | CS2Glove)[]>([]);
  const [loadoutData, setLoadoutData] = useState<any>({});
  const [userSkins, setUserSkins] = useState<UserSkinConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<2 | 3>(2); // 2 = T, 3 = CT

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rarity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);


  useEffect(() => {
    loadCategoryData();
    // Only load user skins for non-loadout categories (needed for customization indicators)
    if (activeCategory !== 'loadout') {
      loadUserSkins();
    }
    setCurrentPage(1); // Reset pagination when category changes
    setSearchQuery(''); // Reset search when category changes
  }, [activeCategory]);

  const loadCategoryData = async () => {
    setIsLoading(true);
    console.log('active category', activeCategory);
    try {
      if (activeCategory === 'loadout') {
        const response = await fetch('/api/user-loadout');
        if (response.ok) {
          const data = await response.json();
          setLoadoutData(data.loadout || {});
        }
      } else if (activeCategory === 'agents') {
        // Fetch agents directly from GitHub
        const agentsData = await fetchAgentsData();
        const terroristAgents = agentsData.filter(agent => agent.team === 2);
        const counterTerroristAgents = agentsData.filter(agent => agent.team === 3);

        setAgents({
          terrorist: terroristAgents,
          counterTerrorist: counterTerroristAgents,
        });
      } else if (activeCategory === 'gloves') {
        // Fetch gloves directly from GitHub and extract unique weapons
        const glovesData = await fetchGlovesData();
        const uniqueWeapons = extractUniqueWeapons([], glovesData);
        setWeapons(uniqueWeapons);
        setSkins([]); // Clear skins when showing weapons
      } else {
        // Fetch skins directly from GitHub and extract unique weapons
        const skinsData = await fetchSkinsData();
        const glovesData = await fetchGlovesData();
        const uniqueWeapons = extractUniqueWeapons(skinsData, glovesData);
        let cat = activeCategory === 'knives' ? 'knifes' : activeCategory;
        // Filter weapons by category
        const filteredWeapons = uniqueWeapons.filter(weapon => weapon.category === cat);
        setWeapons(filteredWeapons);
        setSkins([]); // Clear skins when showing weapons
      }
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSkins = async () => {
    try {
      const response = await fetch('/api/user-skins');
      if (response.ok) {
        const data = await response.json();
        setUserSkins(data.skins || []);
      }
    } catch (error) {
      console.error('Error loading user skins:', error);
    }
  };

  const handleSkinCustomize = (skin: CS2Skin) => {
    const weaponData = encodeURIComponent(JSON.stringify(skin));
    router.push(`/skin-changer/customize?weapon=${weaponData}&team=${selectedTeam}`);
  };

  const handleAgentCustomize = (agent: CS2Agent) => {
    const agentData = encodeURIComponent(JSON.stringify(agent));
    router.push(`/skin-changer/customize?agent=${agentData}&team=${selectedTeam}`);
  };

  const handleWeaponSelect = async (weapon: WeaponType) => {
    setSelectedWeapon(weapon);
    setIsLoading(true);

    try {
      if (weapon.category === 'gloves') {
        const glovesData = await fetchGlovesData();
        const weaponGloves = getGlovesForWeapon(glovesData, weapon.weapon_defindex);
        setWeaponSkins(weaponGloves);
      } else {
        const skinsData = await fetchSkinsData();
        const weaponSkinsData = getSkinsForWeapon(skinsData, weapon.weapon_defindex);
        setWeaponSkins(weaponSkinsData);
      }
    } catch (error) {
      console.error('Error loading weapon skins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeaponSkinSelect = (skin: CS2Skin | CS2Glove) => {
    const skinData = encodeURIComponent(JSON.stringify(skin));
    router.push(`/skin-changer/customize?weapon=${skinData}&team=${selectedTeam}`);
  };

  const handleBackToWeapons = () => {
    setSelectedWeapon(null);
    setWeaponSkins([]);
  };


  // Handle search and sort changes
  const handleSortChange = (newSortBy: 'name' | 'rarity', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Get current items for pagination
  const getCurrentItems = () => {
    if (activeCategory === 'loadout') {
      // Flatten all loadout items from all categories
      const allLoadoutItems = Object.values(loadoutData).flat();
      const filtered = allLoadoutItems.filter((item: any) =>
        item.weaponName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return {
        items: filtered.slice(startIndex, endIndex),
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage)
      };
    } else if (activeCategory === 'agents') {
      const currentAgents = selectedTeam === 2 ? agents.terrorist : agents.counterTerrorist;
      const filtered = currentAgents.filter(agent =>
        agent.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return {
        items: filtered.slice(startIndex, endIndex),
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage)
      };
    } else {
      const filtered = skins.filter(skin =>
        skin.paint_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return {
        items: filtered.slice(startIndex, endIndex),
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage)
      };
    }
  };

  const {items: currentItems, totalItems, totalPages} = getCurrentItems();

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Team Selection */}
        {activeCategory !== 'loadout' && (
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setSelectedTeam(2);
                setCurrentPage(1);
              }}
              variant={selectedTeam === 2 ? 'default' : 'ghost'}
            >
              Terrorist
            </Button>
            <Button
              onClick={() => {
                setSelectedTeam(3);
                setCurrentPage(1);
              }}
              variant={selectedTeam === 3 ? 'default' : 'ghost'}
            >
              Counter-Terrorist
            </Button>
          </div>
        )}

        {/* Search and Filter */}
        {activeCategory === 'agents' && (
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            totalItems={selectedTeam === 2 ? agents.terrorist.length : agents.counterTerrorist.length}
            filteredItems={totalItems}
          />
        )}

        {/* Content Grid */}
        {activeCategory === 'loadout' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {currentItems.map((item: any, index: number) => (
              <LoadoutWeaponCard
                key={`${item.userConfig.weapon_defindex}-${item.userConfig.weapon_team}-${index}`}
                item={item}
                team={selectedTeam}
              />
            ))}
          </div>
        ) : activeCategory === 'agents' ? (
          <SkinGrid
            agents={currentItems as CS2Agent[]}
            searchQuery=""
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedTeam={selectedTeam}
            userSkins={userSkins}
            onSkinCustomize={handleSkinCustomize}
            onAgentCustomize={handleAgentCustomize}
            isLoading={isLoading}
          />
        ) : selectedWeapon ? (
          <WeaponSkinsGrid
            weapon={selectedWeapon}
            skins={weaponSkins}
            userSkins={userSkins}
            selectedTeam={selectedTeam}
            onSkinSelect={handleWeaponSkinSelect}
            onBack={handleBackToWeapons}
            isLoading={isLoading}
          />
        ) : (
          <WeaponSelector
            weapons={weapons}
            userSkins={userSkins}
            selectedTeam={selectedTeam}
            onWeaponSelect={handleWeaponSelect}
            isLoading={isLoading}
          />
        )}

        {/* Pagination */}
        {activeCategory === 'agents' && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}


      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800">
                Skin Changer
              </h1>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">Team Checkmate</span>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-neutral-300 hidden md:block">{user.username}</span>
                </div>
              )}

              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-white/20 text-neutral-300 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2"/>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategoryNavigation
              activeCategory={activeCategory}
              onCategoryChange={(category) => {
                setActiveCategory(category);
                setCurrentPage(1);
                setSelectedWeapon(null);
                setWeaponSkins([]);
              }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm py-0">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2 capitalize">
                        {selectedWeapon ? `${selectedWeapon.display_name} Skins` : activeCategory}
                      </h2>
                      <p className="text-neutral-400">
                        {selectedWeapon
                          ? `Choose a skin for your ${selectedWeapon.display_name}`
                          : `Select your preferred ${activeCategory} for your loadout`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-neutral-300 hover:bg-white/10"
                      >
                        <Grid className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                </div>

                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
}
