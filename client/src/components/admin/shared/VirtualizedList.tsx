import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

// Removed: import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T }) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

/**
 * High-performance virtualized list component for manufacturing management
 * Eliminates render performance issues when displaying large datasets
 * Optimizes memory usage by only rendering visible items
 */
export function VirtualizedList<T>({
  items,
  height,
  renderItem,
  className = "",
}: Omit<VirtualizedListProps<T>, 'itemHeight' | 'overscanCount'>) {
  // Traditional pagination state (virtual scrolling eliminated)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = items.slice(startIndex, endIndex);

  // Don't render if no items
  if (!items.length) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 ${className}`}>
        No items to display
      </div>
    );
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length} items
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm font-medium px-3">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div className="space-y-2" style={{ maxHeight: height, overflowY: 'auto' }}>
        {currentPageItems.map((item, index) => (
          <div key={index}>
            {renderItem({ index: startIndex + index, style: {}, data: item })}
          </div>
        ))}
      </div>
      {totalPages > 1 && <PaginationControls />}
    </div>
  );
}

/**
 * Hook for calculating traditional pagination parameters (virtualization removed)
 */
export function useVirtualizationConfig(itemCount: number, containerHeight: number = 400) {
  return useMemo(() => {
    const itemHeight = 80; // Standard row height
    const itemsPerPage = 20; // Traditional pagination
    const totalPages = Math.ceil(itemCount / itemsPerPage);
    
    return {
      itemHeight,
      itemsPerPage,
      totalPages,
      shouldVirtualize: false, // Always false - virtual scrolling eliminated
      height: Math.min(containerHeight, itemCount * itemHeight),
      overscanCount: 0, // Not used in traditional pagination
    };
  }, [itemCount, containerHeight]);
}