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
	showDetailed?: boolean;
	className?: string;
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
		if (score >= 90) return <CheckCircle className="w-4 h-4" />;
		if (score >= 70) return <TrendingUp className="w-4 h-4" />;
		return <Activity className="w-4 h-4" />;
	};

	return (
		<div className={`performance-status ${className}`}>
			{/* Compact Status Display */}
			<motion.div
				className="flex items-center space-x-2 bg-black/20 rounded-full px-3 py-1 border border-white/10"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<Zap className="w-3 h-3 text-blue-400" />
				<span className="text-xs text-white/70">Performance</span>
				<div className="flex items-center space-x-1">
					{getScoreIcon(metrics.score)}
					<span
						className={`text-xs font-medium ${getScoreColor(metrics.score)}`}
					>
						{metrics.score}/100
					</span>
				</div>

				{showDetailed && (
					<button
						onClick={() => setShowReport(!showReport)}
						className="text-xs text-white/50 hover:text-white/80 transition-colors"
					>
						Details
					</button>
				)}
			</motion.div>

			{/* Detailed Report Modal */}
			{showReport && showDetailed && (
				<motion.div
					className="fixed inset-0 bg-black/80 z-modal flex items-center justify-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					onClick={() => setShowReport(false)}
				>
					<motion.div
						className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
						initial={{ scale: 0.9 }}
						animate={{ scale: 1 }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-xl font-bold text-white mb-4">
							Performance Report
						</h3>
						<pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">
							{JSON.stringify(metrics, null, 2)}
						</pre>
						<button
							onClick={() => setShowReport(false)}
							className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
					<div className="bg-black/10 rounded p-2">
						<div className="text-white/50">Load</div>
						<div className="text-white font-medium">
							{metrics.loadTime.toFixed(0)}ms
						</div>
					</div>
					<div className="bg-black/10 rounded p-2">
						<div className="text-white/50">Memory</div>
						<div className="text-white font-medium">
							{metrics.memoryUsage.toFixed(1)}MB
						</div>
					</div>
					<div className="bg-black/10 rounded p-2">
						<div className="text-white/50">Cache</div>
						<div className="text-white font-medium">
							{metrics.cacheHits > 0
								? Math.round(
										(metrics.cacheHits /
											(metrics.cacheHits + metrics.cacheMisses)) *
											100,
									)
								: 0}
							%
						</div>
					</div>
					<div className="bg-black/10 rounded p-2">
						<div className="text-white/50">Requests</div>
						<div className="text-white font-medium">
							{metrics.networkRequests}
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
}
