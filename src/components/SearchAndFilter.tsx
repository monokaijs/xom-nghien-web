'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'name' | 'rarity';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'rarity', order: 'asc' | 'desc') => void;
  totalItems: number;
  filteredItems: number;
  className?: string;
}

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  totalItems,
  filteredItems,
  className,
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search skins..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-red-500/50"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-gray-300 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortChange('name', sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  'border-white/20 text-gray-300 hover:bg-white/10',
                  sortBy === 'name' && 'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                )}
              </Button>
              
              <Button
                variant={sortBy === 'rarity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortChange('rarity', sortBy === 'rarity' && sortOrder === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  'border-white/20 text-gray-300 hover:bg-white/10',
                  sortBy === 'rarity' && 'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                Rarity
                {sortBy === 'rarity' && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400">
          {searchQuery ? (
            <>Showing {filteredItems} of {totalItems} results</>
          ) : (
            <>{totalItems} items</>
          )}
        </div>
      </div>
    </div>
  );
}
