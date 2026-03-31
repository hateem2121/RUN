import { SpanStatusCode, trace } from "@opentelemetry/api";
import { logger } from "../monitoring/logger.js";
import { isRedisEnabled, redis } from "./upstash-client.js";

// AES-256-GCM Authentication Tag length in bytes

const tracer = trace.getTracer("cache-events");

export interface CacheInvalidationEvent {
  pattern: string;
  timestamp: number;
  reason: "delete" | "update" | "create";
  expiresAt: number; // Timestamp when this event expires
}

// In-memory storage for events (fallback)
// Key: pattern, Value: CacheInvalidationEvent (only latest needed for functional parity with Redis logic optimization)
const localEventStore = new Map<string, CacheInvalidationEvent>();

/**
 * EVENT-DRIVEN CACHE INVALIDATION
 * Emits cache invalidation events using Redis for cross-instance propagation.
 * Frontend polls these events to know when to refetch data.
 */
export async function emitCacheInvalidation(
  pattern: string,
  reason: CacheInvalidationEvent["reason"],
): Promise<void> {
  return tracer.startActiveSpan("cache_events.emit", async (span) => {
    span.setAttribute("cache.pattern", pattern);
    span.setAttribute("cache.reason", reason);

    try {
      const EVENT_TTL_SECONDS = 300; // 5 minutes
      const now = Date.now();

      const event: CacheInvalidationEvent = {
        pattern,
        timestamp: now,
        reason,
        expiresAt: now + EVENT_TTL_SECONDS * 1000,
      };

      // Log emission
      logger.info(`[CacheEvents] Emitting invalidation event: ${pattern} (${reason})`);

      if (isRedisEnabled) {
        const key = `cache:invalidation:latest:${pattern}`;
        // Store latest event with TTL
        await redis.set(key, JSON.stringify(event), { ex: EVENT_TTL_SECONDS });
        span.setAttribute("cache.distributed", true);
      } else {
        // Local fallback
        localEventStore.set(pattern, event);
        span.setAttribute("cache.distributed", false);
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      logger.warn("[CacheEvents] Failed to emit invalidation event:", error);
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
    } finally {
      span.end();
    }
  });
}

/**
 * Get the latest invalidation timestamp for a given cache pattern
 * Used by frontend to detect when backend cache was invalidated
 */
export async function getLatestInvalidationTime(pattern: string): Promise<number> {
  try {
    if (isRedisEnabled) {
      const key = `cache:invalidation:latest:${pattern}`;
      const data = (await redis.get(key)) as CacheInvalidationEvent | null;
      return data ? data.timestamp : 0;
    } else {
      // Local fallback
      const event = localEventStore.get(pattern);
      if (event && event.expiresAt > Date.now()) {
        return event.timestamp;
      }
      return 0;
    }
  } catch (error) {
    logger.error("[CacheEvents] Failed to get latest invalidation time:", error);
    return 0;
  }
}
