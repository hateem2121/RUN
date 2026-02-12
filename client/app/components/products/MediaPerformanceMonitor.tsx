import { useEffect, useState } from "react";

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

export function useMediaPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // Measure memory if available
        // Measure memory if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0;

        setMetrics((prev) => ({
          ...prev,
          fps,
          memoryUsage,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const measureLoadTime = (startTime: number) => {
    const loadTime = performance.now() - startTime;
    setMetrics((prev) => ({ ...prev, loadTime }));
  };

  const measureRenderTime = (startTime: number) => {
    const renderTime = performance.now() - startTime;
    setMetrics((prev) => ({ ...prev, renderTime }));
  };

  return { metrics, measureLoadTime, measureRenderTime };
}
