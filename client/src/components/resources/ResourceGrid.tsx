import { motion } from "framer-motion";
import type { ReactNode } from "react";

// REMOVED: import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"; - replaced with traditional pagination
// import { Loader2 } from "lucide-react"; // Loader2 is not used in the current implementation

interface ResourceGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  enableInfiniteScroll?: boolean;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  isLoading?: boolean;
}

export function ResourceGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 6,
  // enableInfiniteScroll = true,
  emptyState,
  loadingState,
  isLoading = false,
}: ResourceGridProps<T>) {
  // SIMPLIFIED: Direct rendering without infinite scroll
  const itemsToRender = items;
  // const loadMoreRef = { current: null };
  // const hasMore = false;
  // const isLoadingMore = false;
  // Phase 3: Container Query Adoption - Grid responds to container width
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 @md:grid-cols-2",
    3: "grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3",
    4: "grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4",
  };

  if (isLoading && loadingState) {
    return <>{loadingState}</>;
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`@container grid ${gridCols[columns]} gap-${gap}`}
      >
        {itemsToRender.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </motion.div>

      {/* REMOVED: Infinite scroll loading indicator - traditional pagination used instead */}
    </>
  );
}
