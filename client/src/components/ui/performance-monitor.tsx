import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // DISABLED: Performance monitoring causing visual selection issues
    return;

    // Monitor performance metrics with reduced frequency
    if ('performance' in window && 'PerformanceObserver' in window) {
      let lastLogTime = 0;
      const LOG_INTERVAL = 10000; // Log every 10 seconds max

      // Monitor Largest Contentful Paint - Reduced logging
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const now = Date.now();

        if (lastEntry && now - lastLogTime > LOG_INTERVAL) {
          console.log('[Performance] LCP:', lastEntry.startTime.toFixed(0) + 'ms');
          lastLogTime = now;
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // Monitor First Input Delay - Critical only
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          // Only log if FID is concerning (> 100ms)
          if (fid > 100) {
            console.warn('[Performance] High FID:', fid.toFixed(0) + 'ms');
          }
        });
      });

      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // Monitor Cumulative Layout Shift - Critical only
      let clsValue = 0;
      let lastCLSLog = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            const now = Date.now();

            // Only log significant CLS (> 0.1) or major spikes (> 0.05)
            if ((entry.value > 0.05 && clsValue > 0.1) || (now - lastCLSLog > 15000 && clsValue > 0)) {
              console.warn(`[Performance] CLS: ${clsValue.toFixed(6)} (${entry.value > 0.1 ? 'CRITICAL' : 'WARNING'})`);
              lastCLSLog = now;
            }
          }
        });
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }

      return () => {
        try {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        } catch (e) {
          console.warn('[Performance] Error cleaning up observers:', e);
        }
      };
    }
  }, []);

  return null;
}