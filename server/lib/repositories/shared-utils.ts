/**
 * SHARED REPOSITORY UTILITIES
 * Common transaction and cache helpers for repository classes
 */

import { db } from "../../db.js";
import { logger } from "../smart-logger.js";
import { UnifiedCache } from "../unified-cache.js";

const unifiedCache = UnifiedCache.getInstance();

/**
 * TRANSACTION WRAPPER - Provides rollback-aware cache invalidation
 */
export async function withTransaction<T>(
	operation: (tx: typeof db) => Promise<T>,
	cacheKeysToInvalidate: string[] = [],
	operationName?: string,
): Promise<T> {
	const startTime = Date.now();

	try {
		const result = await db.transaction(async (tx) => {
			return await operation(tx as unknown as typeof db);
		});

		// Invalidate cache keys AFTER successful transaction
		if (cacheKeysToInvalidate.length > 0) {
			await Promise.allSettled(
				cacheKeysToInvalidate.map((key) => unifiedCache.clearPattern(key)),
			).catch((err) =>
				logger.debug("Cache invalidation failed (non-critical):", err),
			);
		}

		const duration = Date.now() - startTime;
		if (operationName) {
			logger.debug(
				`[Transaction] ✅ ${operationName} completed in ${duration}ms`,
			);
		}

		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		if (operationName) {
			logger.error(
				`[Transaction] ❌ ${operationName} failed after ${duration}ms:`,
				error,
			);
		}
		throw error;
	}
}

/**
 * CACHE UTILITIES - Common caching patterns
 */
export const cacheUtils = {
	async get<T>(key: string, category?: "data"): Promise<T | null> {
		try {
			return await unifiedCache.get<T>(key, category);
		} catch (error) {
			logger.debug(`[Cache] Get failed for ${key}:`, error);
			return null;
		}
	},

	async set<T>(
		key: string,
		value: T,
		ttl: number,
		category?: "data",
	): Promise<void> {
		try {
			await unifiedCache.set(key, value, ttl, category);
		} catch (error) {
			logger.debug(`[Cache] Set failed for ${key}:`, error);
		}
	},

	async delete(key: string): Promise<void> {
		try {
			await unifiedCache.delete(key);
		} catch (error) {
			logger.debug(`[Cache] Delete failed for ${key}:`, error);
		}
	},

	async clearPattern(pattern: string): Promise<void> {
		try {
			await unifiedCache.clearPattern(pattern);
		} catch (error) {
			logger.debug(`[Cache] Clear pattern failed for ${pattern}:`, error);
		}
	},
};
