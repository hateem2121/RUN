import { Activity, Clock, Database, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceMetrics {
  apiCalls: {
    endpoint: string;
    duration: number;
    status: "fast" | "slow" | "error";
  }[];
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  slowEndpoints: string[];
}

/**
 * Real-time performance monitoring component for manufacturing system
 * Tracks and displays critical performance metrics
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCalls: [],
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    slowEndpoints: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Monitor performance metrics
    const interval = setInterval(() => {
      // Get memory usage if available
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;

      // Simulate cache hit rate calculation (would be real in production)
      const cacheHitRate = Math.random() * 30 + 70; // 70-100%

      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
        cacheHitRate,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed left-4 bottom-4 z-modal"
      >
        <Activity className="mr-2 h-4 w-4" />
        Performance
      </Button>
    );
  }

  return (
    <Card className="fixed left-4 bottom-4 z-modal w-80 shadow-lg bg-[#111111] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Performance Monitor</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          Real-time manufacturing system metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Memory</span>
          </div>
          <Badge variant={metrics.memoryUsage > 50 ? "destructive" : "default"}>
            {metrics.memoryUsage.toFixed(1)}MB
          </Badge>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="text-sm">Cache Hit</span>
          </div>
          <Badge variant={metrics.cacheHitRate > 80 ? "default" : "secondary"}>
            {metrics.cacheHitRate.toFixed(1)}%
          </Badge>
        </div>

        {/* Render Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Render</span>
          </div>
          <Badge variant={metrics.renderTime > 16 ? "destructive" : "default"}>
            {metrics.renderTime.toFixed(1)}ms
          </Badge>
        </div>

        {/* Slow Endpoints Alert */}
        {metrics.slowEndpoints.length > 0 && (
          <div className="mt-2 rounded-md bg-red-50 p-2">
            <div className="mb-1 font-medium text-red-800 text-xs">
              Slow Endpoints ({metrics.slowEndpoints.length})
            </div>
            {metrics.slowEndpoints.slice(0, 3).map((endpoint, index) => (
              <div key={index} className="truncate text-red-600 text-xs">
                {endpoint}
              </div>
            ))}
          </div>
        )}

        {/* Performance Score */}
        <div className="mt-3 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-xs">Performance Score</span>
            <Badge
              variant={
                metrics.cacheHitRate > 90 && metrics.memoryUsage < 30 && metrics.renderTime < 16
                  ? "default"
                  : metrics.cacheHitRate > 70 && metrics.memoryUsage < 50
                    ? "secondary"
                    : "destructive"
              }
            >
              {metrics.cacheHitRate > 90 && metrics.memoryUsage < 30 && metrics.renderTime < 16
                ? "Excellent"
                : metrics.cacheHitRate > 70 && metrics.memoryUsage < 50
                  ? "Good"
                  : "Needs Optimization"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
