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
		} catch (e) {
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
		score >= 80
			? "text-green-600"
			: score >= 60
				? "text-yellow-600"
				: "text-red-600";

	return (
		<Card className="fixed bottom-4 right-4 p-4 bg-white/95 shadow-lg z-modal max-w-xs">
			<div className="space-y-2 text-sm">
				<div className="font-semibold text-gray-700 border-b pb-1">
					Performance Monitor
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">Score:</span>
					<span className={`font-bold ${scoreColor}`}>{score}/100</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">Load Time:</span>
					<span>{metrics.loadTime}ms</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">API Calls:</span>
					<span className={metrics.apiCalls > 10 ? "text-orange-600" : ""}>
						{metrics.apiCalls}
					</span>
				</div>

				{metrics.memoryUsage > 0 && (
					<div className="flex justify-between">
						<span className="text-gray-600">Memory:</span>
						<span
							className={metrics.memoryUsage > 100 ? "text-orange-600" : ""}
						>
							{metrics.memoryUsage} MB
						</span>
					</div>
				)}

				<div className="pt-2 border-t mt-2 text-xs text-gray-500">
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
