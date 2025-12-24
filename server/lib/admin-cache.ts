/**
 * ADMIN STATUS CACHE
 * Cost Optimization: 5-minute LRU cache reduces NEON queries by ~95%
 *
 * Cache Strategy:
 * - Hit: 0ms NEON active time
 * - Miss: ~20ms NEON query + cache update
 * - TTL: 5 minutes (balance between cost and permission freshness)
 *
 * Reference: https://neon.tech/docs/introduction/billing#compute-time
 *
 * ✓ CHECKPOINT: PHASE-3-ADMIN-CACHE
 */

import { LRUCache } from "lru-cache";
import { logger } from "./smart-logger.js";

interface AdminCacheEntry {
	isAdmin: boolean;
	cachedAt: number;
}

/**
 * LRU Cache for admin status
 * Max 1000 users, 5-minute TTL
 * Automatically evicts least recently used entries when full
 */
const adminCache = new LRUCache<string, AdminCacheEntry>({
	max: 1000, // Maximum 1000 cached users
	ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
	updateAgeOnGet: false, // Don't refresh TTL on read (predictable expiration)
});

/**
 * Admin Cache Manager
 * Provides thread-safe cache operations with logging
 */
export const adminCacheManager = {
	/**
	 * Get admin status from cache
	 * @param userId - Replit user ID
	 * @returns boolean if cached, null if cache miss
	 */
	get(userId: string): boolean | null {
		const entry = adminCache.get(userId);
		if (entry) {
			logger.debug(
				`[AdminCache] HIT for user ${userId} (isAdmin=${entry.isAdmin})`,
			);
			return entry.isAdmin;
		}
		logger.debug(`[AdminCache] MISS for user ${userId}`);
		return null;
	},

	/**
	 * Set admin status in cache
	 * @param userId - Replit user ID
	 * @param isAdmin - Admin status
	 */
	set(userId: string, isAdmin: boolean): void {
		adminCache.set(userId, {
			isAdmin,
			cachedAt: Date.now(),
		});
		logger.debug(`[AdminCache] SET user ${userId} = ${isAdmin}`);
	},

	/**
	 * Clear entire cache
	 * Use after bulk permission changes (e.g., mass admin promotion)
	 */
	clear(): void {
		const size = adminCache.size;
		adminCache.clear();
		logger.info(`[AdminCache] CLEARED all ${size} entries`);
	},

	/**
	 * Clear specific user from cache
	 * Use after individual permission change
	 * @param userId - Replit user ID to clear
	 */
	clearUser(userId: string): void {
		const hadEntry = adminCache.delete(userId);
		if (hadEntry) {
			logger.info(`[AdminCache] CLEARED user ${userId}`);
		} else {
			logger.debug(`[AdminCache] User ${userId} not in cache (no-op)`);
		}
	},

	/**
	 * Get cache statistics for monitoring
	 * @returns Cache stats object
	 */
	getStats() {
		return {
			size: adminCache.size,
			maxSize: 1000,
			ttlMs: 5 * 60 * 1000,
			ttlMinutes: 5,
		};
	},
};
