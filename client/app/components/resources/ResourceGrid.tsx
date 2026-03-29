import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";

// REMOVED: import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"; - replaced with traditional pagination
// import { Loader2 } from "lucide-react"; // Loader2 is not used in the current implementation

interface ResourceGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number | undefined;
  enableInfiniteScroll?: boolean | undefined;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  isLoading?: boolean | undefined;
}

interface GridItemProps {
  children: ReactNode;
  index: number;
}

function GridItem({ children, index }: GridItemProps): React.ReactElement {
  const itemRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(itemRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        delay: index * 0.05,
        ease: "power2.out",
      });
    },
    { scope: itemRef },
  );
  return <div ref={itemRef}>{children}</div>;
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
}: ResourceGridProps<T>): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(containerRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    },
    { scope: containerRef },
  );

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
      <div ref={containerRef} className={`@container grid ${gridCols[columns]} gap-${gap}`}>
        {itemsToRender.map((item, index) => (
          <GridItem key={index} index={index}>
            {renderItem(item, index)}
          </GridItem>
        ))}
      </div>

      {/* REMOVED: Infinite scroll loading indicator - traditional pagination used instead */}
    </>
  );
}
