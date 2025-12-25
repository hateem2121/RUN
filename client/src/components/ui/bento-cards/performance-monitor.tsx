import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BarChart3, Download, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconWrapper } from "@/components/ui/icon-wrapper";

interface PerformanceMetrics {
  cls: number;
  lcp: number;
  fid: number;
  memory: number;
  renderTime: number;
  score: number;
}

interface PerformanceAlert {
  type: "warning" | "critical";
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: 0,
    lcp: 0,
    fid: 0,
    memory: 0,
    renderTime: 0,
    score: 100,
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const observer = useRef<PerformanceObserver | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Core Web Vitals monitoring
    const observeMetrics = () => {
      try {
        observer.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();

          entries.forEach((entry) => {
            if (entry.entryType === "layout-shift") {
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                setMetrics((prev) => {
                  const newCls = prev.cls + clsEntry.value;
                  checkThreshold("cls", newCls, 0.1, 0.25);
                  return { ...prev, cls: newCls };
                });
              }
            }

            if (entry.entryType === "largest-contentful-paint") {
              const lcpValue = entry.startTime;
              setMetrics((prev) => {
                checkThreshold("lcp", lcpValue, 2500, 4000);
                return { ...prev, lcp: lcpValue };
              });
            }

            if (entry.entryType === "first-input") {
              const fidValue = (entry as any).processingStart - entry.startTime;
              setMetrics((prev) => {
                checkThreshold("fid", fidValue, 100, 300);
                return { ...prev, fid: fidValue };
              });
            }
          });
        });

        observer.current.observe({
          entryTypes: ["layout-shift", "largest-contentful-paint", "first-input"],
        });
      } catch (_error) {}
    };

    // Memory monitoring
    const monitorMemory = () => {
      if ("memory" in performance) {
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics((prev) => ({ ...prev, memory: memoryUsage }));
      }
    };

    // Render time monitoring
    const monitorRenderTime = () => {
      const renderTime = Date.now() - startTime.current;
      setMetrics((prev) => ({ ...prev, renderTime }));
    };

    const checkThreshold = (metric: string, value: number, warning: number, critical: number) => {
      const alert: PerformanceAlert = {
        type: value > critical ? "critical" : "warning",
        metric,
        value,
        threshold: value > critical ? critical : warning,
        timestamp: Date.now(),
      };

      if (value > warning) {
        setAlerts((prev) => [...prev.slice(-4), alert]);
      }
    };

    observeMetrics();
    const memoryInterval = setInterval(monitorMemory, 1000);
    const renderInterval = setInterval(monitorRenderTime, 500);

    return () => {
      observer.current?.disconnect();
      clearInterval(memoryInterval);
      clearInterval(renderInterval);
    };
  }, []);

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let score = 100;

      // CLS penalty (40% weight)
      if (metrics.cls > 0.25) score -= 40;
      else if (metrics.cls > 0.1) score -= 20;

      // LCP penalty (30% weight)
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;

      // FID penalty (20% weight)
      if (metrics.fid > 300) score -= 20;
      else if (metrics.fid > 100) score -= 10;

      // Memory penalty (10% weight)
      if (metrics.memory > 100) score -= 10;
      else if (metrics.memory > 50) score -= 5;

      return Math.max(0, Math.min(100, score));
    };

    setMetrics((prev) => ({ ...prev, score: calculateScore() }));
  }, [metrics.cls, metrics.lcp, metrics.fid, metrics.memory]);

  return { metrics, alerts, clearAlerts: () => setAlerts([]) };
}

interface PerformanceMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PerformanceMonitor({ isVisible, onClose }: PerformanceMonitorProps) {
  const { metrics, alerts, clearAlerts } = usePerformanceMonitor();

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts,
      recommendations: generateRecommendations(metrics),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const recommendations = [];

    if (metrics.cls > 0.1) {
      recommendations.push(
        "Consider using CSS containment and fixed dimensions to prevent layout shifts",
      );
    }
    if (metrics.lcp > 2500) {
      recommendations.push("Optimize image loading and reduce server response times");
    }
    if (metrics.fid > 100) {
      recommendations.push("Reduce JavaScript execution time and implement code splitting");
    }
    if (metrics.memory > 50) {
      recommendations.push("Implement memory cleanup and optimize Three.js instances");
    }

    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getMetricStatus = (value: number, warning: number, critical: number) => {
    if (value > critical) return "critical";
    if (value > warning) return "warning";
    return "good";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-4 right-4 z-dock w-80 rounded-lg border border-gray-200 bg-white/95 shadow-xl"
        >
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconWrapper size="md" className="text-blue-600" asChild>
                  <BarChart3 />
                </IconWrapper>
                <h3 className="font-semibold text-gray-800">Performance Monitor</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <IconWrapper size="sm" className="text-gray-600" asChild>
                  <X />
                </IconWrapper>
              </button>
            </div>

            {/* Performance Score */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600 text-sm">Overall Score</span>
                <span className={`font-bold text-lg ${getScoreColor(metrics.score)}`}>
                  {Math.round(metrics.score)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.score >= 90
                      ? "bg-green-500"
                      : metrics.score >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${metrics.score}%` }}
                />
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">CLS</span>
                <span
                  className={`font-medium text-sm ${
                    getMetricStatus(metrics.cls, 0.1, 0.25) === "critical"
                      ? "text-red-600"
                      : getMetricStatus(metrics.cls, 0.1, 0.25) === "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {metrics.cls.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">LCP</span>
                <span
                  className={`font-medium text-sm ${
                    getMetricStatus(metrics.lcp, 2500, 4000) === "critical"
                      ? "text-red-600"
                      : getMetricStatus(metrics.lcp, 2500, 4000) === "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {metrics.lcp.toFixed(0)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">FID</span>
                <span
                  className={`font-medium text-sm ${
                    getMetricStatus(metrics.fid, 100, 300) === "critical"
                      ? "text-red-600"
                      : getMetricStatus(metrics.fid, 100, 300) === "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {metrics.fid.toFixed(1)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Memory</span>
                <span className="font-medium text-gray-800 text-sm">
                  {metrics.memory.toFixed(1)}MB
                </span>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <IconWrapper size="sm" className="text-yellow-600" asChild>
                    <AlertTriangle />
                  </IconWrapper>
                  <span className="font-medium text-gray-700 text-sm">Alerts</span>
                  <button
                    onClick={clearAlerts}
                    className="text-blue-600 text-xs hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-20 space-y-1 overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`rounded p-2 text-xs ${
                        alert.type === "critical"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {alert.metric.toUpperCase()}: {alert.value.toFixed(2)} exceeds{" "}
                      {alert.threshold}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={exportReport}
                className="flex items-center gap-1 rounded bg-brand-blue/80 px-3 py-1 text-sm text-white transition-colors hover:bg-brand-blue"
              >
                <IconWrapper size="xs" asChild>
                  <Download />
                </IconWrapper>
                Export
              </button>
              <button
                onClick={clearAlerts}
                className="flex items-center gap-1 rounded bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700"
              >
                <IconWrapper size="xs" asChild>
                  <Zap />
                </IconWrapper>
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
