import { logger } from './smart-logger.js';

const CACHE_EVENT_KEY = 'cache:invalidation:events';

export interface CacheInvalidationEvent {
  pattern: string;
  timestamp: number;
  reason: 'delete' | 'update' | 'create';
  expiresAt: number; // Timestamp when this event expires
}

// In-memory storage for events (replacing Replit KV)
// Key: eventKey, Value: CacheInvalidationEvent
const eventStore = new Map<string, CacheInvalidationEvent>();

/**
 * EVENT-DRIVEN CACHE INVALIDATION
 * Emits cache invalidation events using in-memory storage
 * Frontend polls these events to know when to refetch data
 */
export async function emitCacheInvalidation(
  pattern: string,
  reason: CacheInvalidationEvent['reason']
): Promise<void> {
  try {
    const EVENT_TTL_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    const event: CacheInvalidationEvent = {
      pattern,
      timestamp: now,
      reason,
      expiresAt: now + EVENT_TTL_MS,
    };

    const eventKey = `${CACHE_EVENT_KEY}:${pattern}:${event.timestamp}`;

    // Store event
    eventStore.set(eventKey, event);

    // Cleanup expired events
    for (const [key, storedEvent] of eventStore.entries()) {
      if (storedEvent.expiresAt < now) {
        eventStore.delete(key);
      }
    }

    logger.info(`[CacheEvents] Emitted invalidation event: ${pattern} (${reason})`);
  } catch (error) {
    logger.warn('[CacheEvents] Failed to emit invalidation event:', error);
  }
}

/**
 * Get the latest invalidation timestamp for a given cache pattern
 * Used by frontend to detect when backend cache was invalidated
 */
export async function getLatestInvalidationTime(pattern: string): Promise<number> {
  try {
    const now = Date.now();
    const validTimestamps: number[] = [];

    // Filter events matching the pattern
    for (const [key, event] of eventStore.entries()) {
      if (key.includes(`${CACHE_EVENT_KEY}:${pattern}:`)) {
        if (event.expiresAt > now) {
          validTimestamps.push(event.timestamp);
        } else {
          // Cleanup expired
          eventStore.delete(key);
        }
      }
    }

    if (validTimestamps.length === 0) {
      return 0;
    }

    return Math.max(...validTimestamps);
  } catch (error) {
    logger.error('[CacheEvents] Failed to get latest invalidation time:', error);
    return 0;
  }
}
