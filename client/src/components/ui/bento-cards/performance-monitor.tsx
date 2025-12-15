import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Zap, AlertTriangle, Download, X } from 'lucide-react';

interface PerformanceMetrics {
  cls: number;
  lcp: number;
  fid: number;
  memory: number;
  renderTime: number;
  score: number;
}

interface PerformanceAlert {
  type: 'warning' | 'critical';
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
    score: 100
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const observer = useRef<PerformanceObserver | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Core Web Vitals monitoring
    const observeMetrics = () => {
      try {
        observer.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (entry.entryType === 'layout-shift') {
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                setMetrics(prev => {
                  const newCls = prev.cls + clsEntry.value;
                  checkThreshold('cls', newCls, 0.1, 0.25);
                  return { ...prev, cls: newCls };
                });
              }
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              const lcpValue = entry.startTime;
              setMetrics(prev => {
                checkThreshold('lcp', lcpValue, 2500, 4000);
                return { ...prev, lcp: lcpValue };
              });
            }
            
            if (entry.entryType === 'first-input') {
              const fidValue = (entry as any).processingStart - entry.startTime;
              setMetrics(prev => {
                checkThreshold('fid', fidValue, 100, 300);
                return { ...prev, fid: fidValue };
              });
            }
          });
        });

        observer.current.observe({ entryTypes: ['layout-shift', 'largest-contentful-paint', 'first-input'] });
      } catch (error) {
        console.warn('[Performance Monitor] Observer not supported:', error);
      }
    };

    // Memory monitoring
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memory: memoryUsage }));
      }
    };

    // Render time monitoring
    const monitorRenderTime = () => {
      const renderTime = Date.now() - startTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    const checkThreshold = (metric: string, value: number, warning: number, critical: number) => {
      const alert: PerformanceAlert = {
        type: value > critical ? 'critical' : 'warning',
        metric,
        value,
        threshold: value > critical ? critical : warning,
        timestamp: Date.now()
      };

      if (value > warning) {
        setAlerts(prev => [...prev.slice(-4), alert]);
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

    setMetrics(prev => ({ ...prev, score: calculateScore() }));
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
      recommendations: generateRecommendations(metrics)
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const recommendations = [];
    
    if (metrics.cls > 0.1) {
      recommendations.push("Consider using CSS containment and fixed dimensions to prevent layout shifts");
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
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMetricStatus = (value: number, warning: number, critical: number) => {
    if (value > critical) return 'critical';
    if (value > warning) return 'warning';
    return 'good';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-4 right-4 w-80 bg-white/95 rounded-lg shadow-xl border border-gray-200 z-50"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Performance Monitor</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Performance Score */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Overall Score</span>
                <span className={`text-lg font-bold ${getScoreColor(metrics.score)}`}>
                  {Math.round(metrics.score)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.score >= 90 ? 'bg-green-500' :
                    metrics.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.score}%` }}
                />
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CLS</span>
                <span className={`text-sm font-medium ${
                  getMetricStatus(metrics.cls, 0.1, 0.25) === 'critical' ? 'text-red-600' :
                  getMetricStatus(metrics.cls, 0.1, 0.25) === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.cls.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">LCP</span>
                <span className={`text-sm font-medium ${
                  getMetricStatus(metrics.lcp, 2500, 4000) === 'critical' ? 'text-red-600' :
                  getMetricStatus(metrics.lcp, 2500, 4000) === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.lcp.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">FID</span>
                <span className={`text-sm font-medium ${
                  getMetricStatus(metrics.fid, 100, 300) === 'critical' ? 'text-red-600' :
                  getMetricStatus(metrics.fid, 100, 300) === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.fid.toFixed(1)}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Memory</span>
                <span className="text-sm font-medium text-gray-800">
                  {metrics.memory.toFixed(1)}MB
                </span>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Alerts</span>
                  <button
                    onClick={clearAlerts}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        alert.type === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {alert.metric.toUpperCase()}: {alert.value.toFixed(2)} exceeds {alert.threshold}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={exportReport}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={clearAlerts}
                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}