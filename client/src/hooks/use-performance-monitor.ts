import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  clsScore: number;
  clsEvents: number;
  significantChanges: number;
  lastLogTime: number;
}

export function usePerformanceMonitor(_componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    clsScore: 0,
    clsEvents: 0,
    significantChanges: 0,
    lastLogTime: Date.now(),
  });

  useEffect(() => {
    // DISABLED: Performance monitoring causing visual selection issues
    return () => {};
  }, []);

  return metricsRef.current;
}
