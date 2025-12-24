import { useCallback, useEffect } from "react";

export function useMemoryMonitor() {
  const checkMemory = useCallback(() => {
    type PerformanceWithMemory = Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if ("memory" in performance && (performance as PerformanceWithMemory).memory) {
      const memory = (performance as PerformanceWithMemory).memory!;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      return {
        usedMB: Math.round(usedMB * 10) / 10,
        limitMB: Math.round(limitMB * 10) / 10,
        percentage: Math.round((usedMB / limitMB) * 100),
        critical: usedMB > 500,
        warning: usedMB > 300,
      };
    }
    return null;
  }, []);

  const forceCleanup = useCallback(() => {
    // Force garbage collection if available
    if ("gc" in window && typeof window.gc === "function") {
      try {
        window.gc();
        if (process.env.NODE_ENV === "development") {
        }
      } catch (_e) {
        if (process.env.NODE_ENV === "development") {
        }
      }
    }

    // Clear large 3D models
    type ModelViewerElement = Element & { src?: string };
    const modelViewers = document.querySelectorAll<ModelViewerElement>("model-viewer");
    modelViewers.forEach((viewer, index) => {
      if (index > 1 && viewer.src !== undefined) {
        // Keep only first model loaded
        viewer.src = "";
      }
    });

    // Clear large images not in viewport
    const images = document.querySelectorAll<HTMLImageElement>('img[src*="proxy"]');
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;

      if (!isVisible) {
        img.src =
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==";
      }
    });

    // if (process.env.NODE_ENV === 'development')
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const memoryInfo = checkMemory();
      if (memoryInfo) {
        if (memoryInfo.critical) {
          if (process.env.NODE_ENV === "development") {
          }
          forceCleanup();

          // Emit memory pressure event
          const event = new CustomEvent("memory-pressure", {
            detail: {
              usedMB: memoryInfo.usedMB,
              limitMB: memoryInfo.limitMB,
              percentage: memoryInfo.percentage,
              source: "memory-monitor",
            },
          });
          window.dispatchEvent(event);
        } else if (memoryInfo.warning) {
          if (process.env.NODE_ENV === "development") {
          }
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [checkMemory, forceCleanup]);

  return { checkMemory, forceCleanup };
}
