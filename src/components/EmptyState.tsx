'use client';

import { Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'search' | 'category';
  searchQuery?: string;
  onClearSearch?: () => void;
}

export default function EmptyState({ type, searchQuery, onClearSearch }: EmptyStateProps) {
  if (type === 'search') {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-neutral-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
        <p className="text-neutral-400 mb-4">
          No items found for "{searchQuery}". Try adjusting your search terms.
        </p>
        {onClearSearch && (
          <Button
            onClick={onClearSearch}
            variant="outline"
            className="border-white/20 text-neutral-300 hover:bg-white/10"
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-neutral-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No items available</h3>
      <p className="text-neutral-400">
        No items are currently available for this category.
      </p>
    </div>
  );
}
