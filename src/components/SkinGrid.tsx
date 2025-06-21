'use client';

import {useMemo, useState} from 'react';
import {CS2Agent, CS2Skin, UserSkinConfig} from '@/types/server';
import SkinCard from '@/components/SkinCard';
import EmptyState from '@/components/EmptyState';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Check, Target, Settings} from 'lucide-react';
import {cn} from '@/lib/utils';

interface SkinGridProps {
  skins?: CS2Skin[];
  agents?: CS2Agent[];
  searchQuery: string;
  sortBy: 'name' | 'rarity';
  sortOrder: 'asc' | 'desc';
  selectedTeam: 2 | 3;
  userSkins: UserSkinConfig[];
  onSkinCustomize: (skin: CS2Skin) => void;
  onAgentCustomize?: (agent: CS2Agent) => void;
  isLoading?: boolean;
}

export default function SkinGrid({
                                   skins = [],
                                   agents = [],
                                   searchQuery,
                                   sortBy,
                                   sortOrder,
                                   selectedTeam,
                                   userSkins,
                                   onSkinCustomize,
                                   onAgentCustomize,
                                   isLoading = false,
                                 }: SkinGridProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (id: string) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  // Helper function to check if a skin is customized
  const isSkinCustomized = (skin: CS2Skin) => {
    return userSkins.some(userSkin =>
      userSkin.weapon_defindex === skin.weapon_defindex &&
      userSkin.weapon_team === selectedTeam &&
      userSkin.weapon_paint_id == skin.paint
    );
  };

  // Helper function to check if an agent is customized
  const isAgentCustomized = (agent: CS2Agent) => {
    return userSkins.some(userSkin =>
      userSkin.weapon_defindex === agent.model &&
      userSkin.weapon_team === selectedTeam
    );
  };

  // Filter and sort skins
  const filteredAndSortedSkins = useMemo(() => {
    let filtered = skins.filter(skin =>
      skin.paint_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by customization status first, then by name or rarity
    filtered.sort((a, b) => {
      const aCustomized = isSkinCustomized(a);
      const bCustomized = isSkinCustomized(b);

      // Prioritize customized items first
      if (aCustomized && !bCustomized) return -1;
      if (!aCustomized && bCustomized) return 1;

      // If both have same customization status, sort by selected criteria
      if (sortBy === 'name') {
        const comparison = a.paint_name.localeCompare(b.paint_name);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // Simple rarity sorting based on paint name keywords
        const getRarityScore = (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName.includes('dragon') || lowerName.includes('howl')) return 5;
          if (lowerName.includes('asiimov') || lowerName.includes('hyper beast')) return 4;
          if (lowerName.includes('redline') || lowerName.includes('vulcan')) return 3;
          if (lowerName.includes('blue') || lowerName.includes('steel')) return 2;
          return 1;
        };

        const scoreA = getRarityScore(a.paint_name);
        const scoreB = getRarityScore(b.paint_name);
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
    });

    return filtered;
  }, [skins, searchQuery, sortBy, sortOrder, userSkins, selectedTeam]);

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents.filter(agent =>
      agent.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      agent.team === selectedTeam
    );

    // Sort by customization status first, then by name
    filtered.sort((a, b) => {
      const aCustomized = isAgentCustomized(a);
      const bCustomized = isAgentCustomized(b);

      // Prioritize customized items first
      if (aCustomized && !bCustomized) return -1;
      if (!aCustomized && bCustomized) return 1;

      // If both have same customization status, sort by name
      const comparison = a.agent_name.localeCompare(b.agent_name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [agents, searchQuery, selectedTeam, userSkins, sortOrder]);



  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({length: 20}).map((_, index) => (
          <Card key={index} className="bg-white/5 border-white/10 animate-pulse p-0">
            <CardContent className="p-0">
              <div className="aspect-[4/3] bg-neutral-700/50 rounded-t-lg"/>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-700/50 rounded w-3/4"/>
                <div className="h-6 bg-neutral-700/50 rounded w-1/2"/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Render agents grid
  if (agents.length > 0) {
    if (filteredAndSortedAgents.length === 0) {
      return <EmptyState type="search" searchQuery={searchQuery}/>;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAndSortedAgents.map((agent, index) => {
          const agentId = `${agent.model}-${agent.team}`;
          const hasError = imageErrors.has(agentId);
          const isCustomized = isAgentCustomized(agent);

          return (
            <Card
              key={agentId}
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-white/5 border-white/10 backdrop-blur-sm p-0",
                isCustomized && "border-green-500/30 bg-green-500/5"
              )}
            >
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] overflow-hidden">
                {hasError ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                    <Target className="w-8 h-8 mb-2"/>
                    <span className="text-sm">Image not available</span>
                  </div>
                ) : (
                  <img
                    src={agent.image}
                    alt={agent.agent_name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(agentId)}
                  />
                )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

                  {/* Customized Badge */}
                  {isCustomized && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500/80 hover:bg-green-500/80 text-white border-0 text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Customized
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4">
                <h3 className="text-white font-medium text-sm mb-2 h-[2rem] line-clamp-2 leading-tight">
                  {agent.agent_name}
                </h3>

                <Button
                  size="sm"
                  onClick={() => onAgentCustomize?.(agent)}
                  className="text-xs px-3 py-1 h-7 w-full bg-white/10 hover:bg-red-500 text-white"
                >
                  {isCustomized ? 'Edit' : 'Customize'}
                </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Render skins grid
  if (filteredAndSortedSkins.length === 0) {
    return <EmptyState type={searchQuery ? "search" : "category"} searchQuery={searchQuery}/>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredAndSortedSkins.map((skin, index) => (
        <SkinCard
          key={`${skin.weapon_defindex}-${skin.paint}-${index}`}
          skin={skin}
          onCustomize={onSkinCustomize}
          team={selectedTeam}
          userSkins={userSkins}
        />
      ))}
    </div>
  );
}
