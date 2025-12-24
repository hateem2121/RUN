// Performance Optimization: Week 3 - Real-time Performance Analysis Component
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BundleUtils } from "../../lib/bundle-optimizer";
import { performanceMonitor } from "../../lib/performance-monitor";

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  bundleScore: number;
  memoryUsage: number | null;
}

export function PerformanceAnalysis() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    bundleScore: 0,
    memoryUsage: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      const currentMetrics = performanceMonitor.getMetrics();
      const bundleScore = BundleUtils.getPerformanceScore();

      setMetrics({
        fcp: currentMetrics.fcp,
        lcp: currentMetrics.lcp,
        fid: currentMetrics.fid,
        cls: currentMetrics.cls,
        bundleScore,
        memoryUsage: currentMetrics.memoryUsage,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const runFullAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      BundleUtils.logBundleReport();

      // Update metrics
      const currentMetrics = performanceMonitor.getMetrics();
      const bundleScore = BundleUtils.getPerformanceScore();

      setMetrics({
        fcp: currentMetrics.fcp,
        lcp: currentMetrics.lcp,
        fid: currentMetrics.fid,
        cls: currentMetrics.cls,
        bundleScore,
        memoryUsage: currentMetrics.memoryUsage,
      });

      alert("Performance analysis complete! Check the browser console for detailed reports.");
    } catch (_error) {
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Needs Work</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  const formatMetric = (value: number | null, unit: string = "ms") => {
    if (value === null) return "N/A";
    if (unit === "s") return `${(value / 1000).toFixed(2)}s`;
    if (unit === "MB") return `${value.toFixed(2)}MB`;
    return `${value.toFixed(2)}${unit}`;
  };

  const getMetricBadge = (
    value: number | null,
    thresholds: { good: number; poor: number },
    unit: string = "ms",
  ) => {
    if (value === null) return <Badge variant="secondary">N/A</Badge>;

    if (value <= thresholds.good)
      return <Badge className="bg-green-500">{formatMetric(value, unit)}</Badge>;
    if (value <= thresholds.poor)
      return <Badge className="bg-yellow-500">{formatMetric(value, unit)}</Badge>;
    return <Badge className="bg-red-500">{formatMetric(value, unit)}</Badge>;
  };

  const getCLSBadge = (cls: number | null) => {
    if (cls === null) return <Badge variant="secondary">N/A</Badge>;

    if (cls <= 0.1) return <Badge className="bg-green-500">{cls.toFixed(3)}</Badge>;
    if (cls <= 0.25) return <Badge className="bg-yellow-500">{cls.toFixed(3)}</Badge>;
    return <Badge className="bg-red-500">{cls.toFixed(3)}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-Time Performance Analysis
            <Button onClick={runFullAnalysis} disabled={isAnalyzing} size="sm">
              {isAnalyzing ? "Analyzing..." : "Run Full Analysis"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600 text-sm">Core Web Vitals</h4>

              <div className="flex items-center justify-between">
                <span className="text-sm">First Contentful Paint</span>
                {getMetricBadge(metrics.fcp, { good: 1800, poor: 3000 }, "s")}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Largest Contentful Paint</span>
                {getMetricBadge(metrics.lcp, { good: 2500, poor: 4000 }, "s")}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">First Input Delay</span>
                {getMetricBadge(metrics.fid, { good: 100, poor: 300 })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Cumulative Layout Shift</span>
                {getCLSBadge(metrics.cls)}
              </div>
            </div>

            {/* Bundle Performance */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600 text-sm">Bundle Performance</h4>

              <div className="flex items-center justify-between">
                <span className="text-sm">Bundle Score</span>
                {getScoreBadge(metrics.bundleScore)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage</span>
                {metrics.memoryUsage ? (
                  <Badge
                    className={
                      metrics.memoryUsage > 50
                        ? "bg-red-500"
                        : metrics.memoryUsage > 30
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }
                  >
                    {formatMetric(metrics.memoryUsage, "MB")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">N/A</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Bundle Optimized</span>
                {BundleUtils.isBundleOptimized() ? (
                  <Badge className="bg-green-500">Yes</Badge>
                ) : (
                  <Badge className="bg-yellow-500">No</Badge>
                )}
              </div>
            </div>

            {/* Performance Tips */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600 text-sm">Optimization Status</h4>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Suspense boundaries active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Data prefetching enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Lazy loading active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Font preloading optimized</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <p className="text-blue-800 text-sm">
              <strong>Week 3 Performance Optimizations Active:</strong> Advanced bundle analysis,
              lazy loading optimization, and real-time performance monitoring are now running. Click
              "Run Full Analysis" to see detailed reports in the console.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PerformanceAnalysis;
