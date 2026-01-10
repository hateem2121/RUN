import { useEffect, useRef, useState } from "react";

interface GridDimensions {
  width: number;
  height: number;
  columnsPerRow: number;
  itemWidth: number;
  itemHeight: number;
}

export function useGridDimensions(viewMode: "grid" | "list") {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<GridDimensions>({
    width: 1200,
    height: 600,
    columnsPerRow: 4,
    itemWidth: 280,
    itemHeight: 320,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Use container dimensions with padding adjustments
      const width = Math.max(800, rect.width - 32); // 32px for padding
      const height = Math.max(400, rect.height - 32);

      // Calculate responsive columns and item sizes
      let columnsPerRow: number;
      let itemWidth: number;
      let itemHeight: number;

      if (viewMode === "grid") {
        // Responsive grid layout
        if (width < 640) {
          columnsPerRow = 2;
          itemWidth = Math.floor((width - 16) / 2); // 16px gap between items
        } else if (width < 1024) {
          columnsPerRow = 3;
          itemWidth = Math.floor((width - 32) / 3); // 32px total gaps
        } else if (width < 1400) {
          columnsPerRow = 4;
          itemWidth = Math.floor((width - 48) / 4); // 48px total gaps
        } else {
          columnsPerRow = 5;
          itemWidth = Math.floor((width - 64) / 5); // 64px total gaps
        }
        itemHeight = itemWidth + 120; // Add space for metadata below image
      } else {
        // List view: single column, wider items
        columnsPerRow = 1;
        itemWidth = width - 32;
        itemHeight = 120;
      }

      setDimensions({
        width,
        height,
        columnsPerRow,
        itemWidth,
        itemHeight,
      });
    };

    // Initial calculation
    updateDimensions();

    // Setup ResizeObserver for better performance than window resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewMode]);

  return {
    containerRef,
    dimensions,
  };
}
