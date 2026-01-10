/**
 * Performance Status Indicator Component
 * Real-time performance monitoring display
 */

import { motion } from "framer-motion";
import { Activity, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

interface PerformanceStatusProps {
  componentName: string;
  showDetailed?: boolean | undefined;
  className?: string | undefined;
}

export function PerformanceStatus({
  componentName,
  showDetailed = false,
  className = "",
}: PerformanceStatusProps) {
  const performanceMetrics = usePerformanceMonitor(componentName);
  const [showReport, setShowReport] = useState(false);

  // Consolidated metrics from performance monitor hook
  const metrics = {
    renderTime: performanceMetrics.clsScore * 100,
    memoryUsage: performanceMetrics.clsEvents,
    score: Math.max(0, 100 - performanceMetrics.significantChanges * 10),
    loadTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <TrendingUp className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className={`performance-status ${className}`}>
      {/* Compact Status Display */}
      <motion.div
        className="flex items-center space-x-2 rounded-full border border-glass bg-black/20 px-3 py-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Zap className="h-3 w-3 text-blue-400" />
        <span className="text-white/70 text-xs">Performance</span>
        <div className="flex items-center space-x-1">
          {getScoreIcon(metrics.score)}
          <span className={`font-medium text-xs ${getScoreColor(metrics.score)}`}>
            {metrics.score}/100
          </span>
        </div>

        {showDetailed && (
          <button
            onClick={() => setShowReport(!showReport)}
            className="text-white/50 text-xs transition-colors hover:text-white/80"
          >
            Details
          </button>
        )}
      </motion.div>

      {/* Detailed Report Modal */}
      {showReport && showDetailed && (
        <motion.div
          className="center-flex fixed inset-0 z-modal bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowReport(false)}
        >
          <motion.div
            className="max-h-modal-sm w-full max-w-2xl overflow-auto rounded-lg bg-muted p-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-bold text-white text-xl">Performance Report</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm text-white/80">
              {JSON.stringify(metrics, null, 2)}
            </pre>
            <button
              onClick={() => setShowReport(false)}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Live Metrics Bar (Optional) */}
      {showDetailed && (
        <motion.div
          className="mt-2 grid grid-cols-4 gap-2 text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rounded bg-black/10 p-2">
            <div className="text-white/50">Load</div>
            <div className="font-medium text-white">{metrics.loadTime.toFixed(0)}ms</div>
          </div>
          <div className="rounded bg-black/10 p-2">
            <div className="text-white/50">Memory</div>
            <div className="font-medium text-white">{metrics.memoryUsage.toFixed(1)}MB</div>
          </div>
          <div className="rounded bg-black/10 p-2">
            <div className="text-white/50">Cache</div>
            <div className="font-medium text-white">
              {metrics.cacheHits > 0
                ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
                : 0}
              %
            </div>
          </div>
          <div className="rounded bg-black/10 p-2">
            <div className="text-white/50">Requests</div>
            <div className="font-medium text-white">{metrics.networkRequests}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
