import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface PerformanceMetrics {
  loadTime: number;
  apiCalls: number;
  memoryUsage: number;
  cacheHits: number;
  renderCount: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    apiCalls: 0,
    memoryUsage: 0,
    cacheHits: 0,
    renderCount: 0,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setVisible(true);
    }

    // Track page load time
    const loadTime = performance.now();
    setMetrics((prev) => ({ ...prev, loadTime: Math.round(loadTime) }));

    // Track API calls using Performance Observer (non-invasive)
    let apiCallCount = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource" && entry.name.includes("/api/")) {
          apiCallCount++;
          setMetrics((prev) => ({ ...prev, apiCalls: apiCallCount }));
        }
      }
    });

    // Observe fetch/XHR requests
    try {
      observer.observe({ entryTypes: ["resource"] });
    } catch (_e) {
      // PerformanceObserver not supported, skip API tracking
    }

    // Track memory usage if available (Chrome only)
    let memoryInterval: NodeJS.Timeout | null = null;
    if ("memory" in performance) {
      const updateMemory = () => {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          const memoryMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
          setMetrics((prev) => ({ ...prev, memoryUsage: memoryMB }));
        }
      };
      updateMemory();
      memoryInterval = setInterval(updateMemory, 2000);
    }

    return () => {
      observer.disconnect();
      if (memoryInterval) clearInterval(memoryInterval);
    };
  }, []);

  if (!visible) return null;

  // Calculate performance score
  const score = Math.max(
    0,
    Math.min(
      100,
      100 -
        (metrics.apiCalls > 10 ? 20 : 0) -
        (metrics.loadTime > 2000 ? 20 : 0) -
        (metrics.memoryUsage > 100 ? 20 : 0),
    ),
  );

  const scoreColor =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <Card className="fixed right-4 bottom-4 z-modal max-w-xs bg-white/95 p-4 shadow-lg">
      <div className="space-y-2 text-sm">
        <div className="border-b pb-1 font-semibold text-foreground/80">Performance Monitor</div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Score:</span>
          <span className={`font-bold ${scoreColor}`}>{score}/100</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Load Time:</span>
          <span>{metrics.loadTime}ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">API Calls:</span>
          <span className={metrics.apiCalls > 10 ? "text-orange-600" : ""}>{metrics.apiCalls}</span>
        </div>

        {metrics.memoryUsage > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memory:</span>
            <span className={metrics.memoryUsage > 100 ? "text-orange-600" : ""}>
              {metrics.memoryUsage} MB
            </span>
          </div>
        )}

        <div className="mt-2 border-t pt-2 text-muted-foreground text-xs">
          Optimizations Active:
          <ul className="mt-1 space-y-0.5">
            <li>✓ React.memo on cards</li>
            <li>✓ Query caching (5min)</li>
            <li>✓ Lazy modal loading</li>
            <li>✓ Limited media (50)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
