import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  clsScore: number;
  clsEvents: number;
  significantChanges: number;
  lastLogTime: number;
}

export function usePerformanceMonitor(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    clsScore: 0,
    clsEvents: 0,
    significantChanges: 0,
    lastLogTime: Date.now()
  });

  useEffect(() => {
    // DISABLED: Performance monitoring causing visual selection issues
    return () => {};
  }, [componentName]);

  return metricsRef.current;
}