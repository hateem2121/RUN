import { logger } from '../lib/smart-logger.js';
/**
 * QUERY TIMEOUT PROTECTION
 * Phase 4.2: Safe query execution with timeout protection
 * Provides graceful degradation for database operations
 * 
 * COLD START RESILIENCE: Supports environment-aware timeouts
 * - Production cache warming: 15s (handles Neon cold starts)
 * - Development/normal queries: 5s (fast failure for debugging)
 */

import { performanceMonitor } from './query-performance-monitor.js';

/**
 * COLD START RESILIENCE: Global warmup timeout override
 * Set during cache warming startup to extend query timeouts
 */
let warmupTimeoutOverride: number | null = null;

export function setWarmupTimeout(timeoutMs: number | null): void {
  warmupTimeoutOverride = timeoutMs;
}

export async function safeQuery<T>(
  queryFn: () => Promise<T>, 
  timeoutMs: number = 5000
): Promise<T | null> {
  // Use warmup timeout override if set (for cold start resilience)
  const effectiveTimeout = warmupTimeoutOverride ?? timeoutMs;
  const startTime = performance.now();
  
  try {
    const result = await Promise.race([
      queryFn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), effectiveTimeout)
      )
    ]);
    
    // Track successful query
    performanceMonitor.trackQuery(startTime, true);
    return result;
  } catch (error) {
    // Track failed query
    performanceMonitor.trackQuery(startTime, false);
    
    if (error instanceof Error && error.message === 'Query timeout') {
      logger.error(`🕐 Query timeout after ${effectiveTimeout}ms`);
    } else {
      logger.error('Query failed:', error);
    }
    
    return null; // Graceful degradation
  }
}

/**
 * Safe query with custom error handling
 */
export async function safeQueryWithFallback<T>(
  queryFn: () => Promise<T>,
  fallbackFn: () => Promise<T> | T,
  timeoutMs: number = 5000
): Promise<T> {
  const result = await safeQuery(queryFn, timeoutMs);
  
  if (result === null) {
    logger.warn('🔄 Query failed, using fallback');
    return await fallbackFn();
  }
  
  return result;
}

/**
 * Safe query for multiple operations with individual timeouts
 */
export async function safeQueryBatch<T>(
  queries: Array<() => Promise<T>>,
  timeoutMs: number = 5000
): Promise<Array<T | null>> {
  return Promise.all(
    queries.map(query => safeQuery(query, timeoutMs))
  );
}