// import { useEffect, useRef } from 'react';

// interface PerformanceMetrics {
//   loadTime: number;
//   renderTime: number;
//   imagesLoaded: number;
//   videosLoaded: number;
//   totalMediaSize: number;
// }

export function usePerformanceMonitor(_componentName: string, _enabled: boolean = false) {
  // PERFORMANCE OPTIMIZATION: Disabled to fix visual selection issues
  return {
    metrics: {
      loadTime: 0,
      renderTime: 0,
      imagesLoaded: 0,
      videosLoaded: 0,
      totalMediaSize: 0,
    },
  };
}
