'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import CategoryNavigation, { SkinCategory } from '@/components/CategoryNavigation';
import SearchAndFilter from '@/components/SearchAndFilter';
import SkinGrid from '@/components/SkinGrid';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CS2Skin, CS2Agent, UserSkinConfig } from '@/types/server';
import { LogOut, Grid, List, Package } from 'lucide-react';
import {cn} from "@/lib/utils";

export default function SkinChangerPage() {
  return (
    <ProtectedRoute>
      <SkinChangerDashboard />
    </ProtectedRoute>
  );
}

function SkinChangerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<SkinCategory>('pistols');
  const [skins, setSkins] = useState<CS2Skin[]>([]);
  const [agents, setAgents] = useState<{ terrorist: CS2Agent[]; counterTerrorist: CS2Agent[] }>({
    terrorist: [],
    counterTerrorist: [],
  });
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
    loadUserSkins();
    setCurrentPage(1); // Reset pagination when category changes
    setSearchQuery(''); // Reset search when category changes
  }, [activeCategory]);

  const loadCategoryData = async () => {
    setIsLoading(true);
    try {
      if (activeCategory === 'agents') {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
        }
      } else {
        const response = await fetch(`/api/skins?category=${activeCategory}`);
        if (response.ok) {
          const data = await response.json();
          setSkins(data.skins || []);
        }
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
    if (activeCategory === 'agents') {
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

  const { items: currentItems, totalItems, totalPages } = getCurrentItems();

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Team Selection */}
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

        {/* Search and Filter */}
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          totalItems={activeCategory === 'agents' ?
            (selectedTeam === 2 ? agents.terrorist.length : agents.counterTerrorist.length) :
            skins.length
          }
          filteredItems={totalItems}
        />

        {/* Content Grid */}
        {activeCategory === 'agents' ? (
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
        ) : (
          <SkinGrid
            skins={currentItems as CS2Skin[]}
            searchQuery=""
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedTeam={selectedTeam}
            userSkins={userSkins}
            onSkinCustomize={handleSkinCustomize}
            isLoading={isLoading}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800">
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
                onClick={() => router.push('/skin-changer/loadout')}
                variant="outline"
                size="sm"
                className="border-white/20 text-neutral-300 hover:bg-white/10"
              >
                <Package className="w-4 h-4 mr-2" />
                My Loadout
              </Button>

              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-white/20 text-neutral-300 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
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
              onCategoryChange={setActiveCategory}
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
                        {activeCategory}
                      </h2>
                      <p className="text-neutral-400">
                        Select your preferred {activeCategory} for your loadout
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-neutral-300 hover:bg-white/10"
                      >
                        <Grid className="w-4 h-4" />
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
