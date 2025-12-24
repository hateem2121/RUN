/**
 * UNIFIED MEMORY CACHE SERVICE
 * Specialized cache for manufacturing, media, and config list/batch queries.
 *
 * REPLACES: TwoTierBatchCache (Legacy)
 * - Formerly "TwoTierBatchCache", now explicitly renamed to reflect infrastructure reality.
 * - Delegates to UnifiedCache (L1 Memory) since no Redis L2 is present.
 * - Preserves benchmarking and bypass logic for existing consumers.
 *
 * ARCHITECTURE:
 * - Single Tier (In-Memory LRU): via UnifiedCache
 * - SWR: Fresh/Stale/Expire operations supported
 *
 * SUCCESS CRITERIA:
 * - Largest batch queries < 300ms
 * - Cache hit handling
 */

import { logger } from "./smart-logger.js";
import type { SWRConfig } from "./unified-cache.js";
import { unifiedCache } from "./unified-cache.js";

interface CacheMetrics {
	hits: number;
	misses: number;
	totalRequests: number;
	avgHitTime: number;
	avgLoaderTime: number;
}

interface BenchmarkResult {
	cacheKey: string;
	l1Time: number | null; // Formerly L1/L2 distinction, now L1 = Memory Hit
	l2Time: number | null; // Deprecated: Always null in Memory-only mode
	dbTime: number | null;
	hit: "L1" | "MISS"; // Simplified: "L2" removed as it does not exist
	improvement: number | null; // % improvement
}

export class UnifiedMemoryCache {
	private static instance: UnifiedMemoryCache;
	private metrics: CacheMetrics;

	private responseTimesHit: number[] = [];
	private responseTimesLoader: number[] = [];
	private readonly MAX_RESPONSE_BUFFER = 100;

	private constructor() {
		this.metrics = {
			hits: 0,
			misses: 0,
			totalRequests: 0,
			avgHitTime: 0,
			avgLoaderTime: 0,
		};

		logger.info(
			"[UnifiedMemoryCache] 🚀 Initialized: Delegating to UnifiedCache (In-Memory)",
		);
	}

	public static getInstance(): UnifiedMemoryCache {
		if (!UnifiedMemoryCache.instance) {
			UnifiedMemoryCache.instance = new UnifiedMemoryCache();
		}
		return UnifiedMemoryCache.instance;
	}

	/**
	 * Get data with SWR-enabled cache lookup
	 * Delegates to UnifiedCache.getSWR()
	 */
	async get<T>(
		key: string,
		fetchFn: () => Promise<T>,
		options?: {
			bypassCache?: boolean;
			swrConfig?: SWRConfig;
		},
	): Promise<{ data: T; benchmark: BenchmarkResult }> {
		this.metrics.totalRequests++;

		const benchmark: BenchmarkResult = {
			cacheKey: key,
			l1Time: null,
			l2Time: null,
			dbTime: null,
			hit: "MISS",
			improvement: null,
		};

		const cache = unifiedCache;
		const startTime = performance.now();

		// Bypass cache check
		if (options?.bypassCache) {
			logger.debug(`[UnifiedMemoryCache] Cache bypass for ${key}`);
			this.metrics.misses++;

			const dbStart = performance.now();
			const data = await fetchFn();
			const dbTime = performance.now() - dbStart;

			benchmark.dbTime = dbTime;
			this.recordLoaderTime(dbTime);

			if (options.swrConfig) {
				await cache
					.setSWR(`batch:${key}`, data, options.swrConfig)
					.catch((err) =>
						logger.warn(
							`[UnifiedMemoryCache] Failed to update cache after bypass:`,
							err,
						),
					);
			}

			return { data, benchmark };
		}

		// Cache Lookup (SWR or Regular)
		// We strictly use SWR pattern if config provided, ensuring consistent behavior.
		if (options?.swrConfig) {
			const result = await cache.getSWR(
				`batch:${key}`,
				fetchFn,
				options.swrConfig,
			);
			const timingValue =
				result.timings.cacheTime ||
				result.timings.loaderTime ||
				result.timings.totalTime;

			if (
				result.source === "memory" ||
				(result.source as string) === "stale_memory"
			) {
				// HIT
				benchmark.hit = "L1";
				benchmark.l1Time = timingValue;
				this.metrics.hits++;
				this.recordHitTime(timingValue);
			} else {
				// MISS (Loader)
				benchmark.hit = "MISS";
				benchmark.dbTime = timingValue;
				this.metrics.misses++;
				this.recordLoaderTime(timingValue);
			}

			return { data: result.data, benchmark };
		}

		// Legacy/Simple Path
		const batchKey = `batch:${key}`;
		const cachedData = await cache.get<T>(batchKey);

		if (cachedData) {
			const totalTime = performance.now() - startTime;
			benchmark.hit = "L1";
			benchmark.l1Time = totalTime;
			this.metrics.hits++;
			this.recordHitTime(totalTime);
			return { data: cachedData, benchmark };
		}

		// Miss
		this.metrics.misses++;
		const dbStart = performance.now();
		const data = await fetchFn();
		const dbTime = performance.now() - dbStart;

		benchmark.dbTime = dbTime;
		this.recordLoaderTime(dbTime);

		// Default 30 min TTL if no config
		await cache
			.set(batchKey, data, 30 * 60)
			.catch((err) =>
				logger.warn(`[UnifiedMemoryCache] Failed to set cache:`, err),
			);

		return { data, benchmark };
	}

	async invalidate(key: string): Promise<void> {
		const cache = unifiedCache;
		await cache.delete(`batch:${key}`);
		// Cleanup simple key too if exists
		await cache.delete(key).catch(() => {});
	}

	getMetrics() {
		const { hits, misses, totalRequests } = this.metrics;
		return {
			hitRate: totalRequests > 0 ? (hits / totalRequests) * 100 : 0,
			missRate: totalRequests > 0 ? (misses / totalRequests) * 100 : 0,
			avgHitTime: this.metrics.avgHitTime,
			avgLoaderTime: this.metrics.avgLoaderTime,
			totalRequests,
		};
	}

	logPerformanceReport(context: string): void {
		const metrics = this.getMetrics();
		logger.info(`\n[UnifiedMemoryCache] 📊 Report: ${context}`);
		logger.info(`├─ Requests: ${metrics.totalRequests}`);
		logger.info(`├─ Hit Rate: ${metrics.hitRate.toFixed(2)}%`);
		logger.info(`└─ Avg Hit: ${metrics.avgHitTime.toFixed(2)}ms`);
	}

	private recordHitTime(time: number) {
		this.responseTimesHit.push(time);
		if (this.responseTimesHit.length > this.MAX_RESPONSE_BUFFER)
			this.responseTimesHit.shift();
		this.metrics.avgHitTime =
			this.responseTimesHit.reduce((a, b) => a + b, 0) /
			this.responseTimesHit.length;
	}

	private recordLoaderTime(time: number) {
		this.responseTimesLoader.push(time);
		if (this.responseTimesLoader.length > this.MAX_RESPONSE_BUFFER)
			this.responseTimesLoader.shift();
		this.metrics.avgLoaderTime =
			this.responseTimesLoader.reduce((a, b) => a + b, 0) /
			this.responseTimesLoader.length;
	}
}

export const unifiedMemoryCache = UnifiedMemoryCache.getInstance();
