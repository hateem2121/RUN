/**
 * Event Bus - Lightweight Event-Driven Architecture
 *
 * Provides publish/subscribe capability for:
 * - Audit log events
 * - Cache invalidation
 * - Integration events (future microservices)
 *
 * Design: In-memory for now, can be upgraded to Redis Pub/Sub or Cloud Pub/Sub
 */

import { EventEmitter } from "node:events";
import { logger } from "../monitoring/logger.js";

// Event type definitions
export type EventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "cache.invalidate"
  | "audit.log"
  | "media.uploaded"
  | "media.deleted";

export interface BaseEvent<T = unknown> {
  type: EventType;
  timestamp: string;
  correlationId?: string;
  source: string;
  data: T;
}

export interface UserEvent extends BaseEvent<{ userId: string; email?: string }> {
  type: "user.created" | "user.updated" | "user.deleted";
}

export interface ProductEvent extends BaseEvent<{ productId: string; slug?: string }> {
  type: "product.created" | "product.updated" | "product.deleted";
}

export interface CacheInvalidateEvent extends BaseEvent<{ keys: string[] }> {
  type: "cache.invalidate";
}

export interface AuditEvent
  extends BaseEvent<{
    userId?: string;
    action: string;
    resource: string;
    details?: Record<string, unknown>;
  }> {
  type: "audit.log";
}

type EventPayload =
  | UserEvent
  | ProductEvent
  | CacheInvalidateEvent
  | AuditEvent
  | BaseEvent;

// Event handler type
type EventHandler<T extends EventPayload = EventPayload> = (event: T) => void | Promise<void>;

/**
 * Singleton Event Bus
 */
class EventBus {
  private emitter: EventEmitter;
  private handlers: Map<EventType, Set<EventHandler>>;
  private isShuttingDown = false;

  constructor() {
    this.emitter = new EventEmitter();
    this.handlers = new Map();

    // Increase listener limit for production use
    this.emitter.setMaxListeners(100);

    // Forward all events to central logger
    this.emitter.on("event", (event: EventPayload) => {
      logger.debug("Event emitted", { type: event.type, correlationId: event.correlationId });
    });
  }

  /**
   * Publish an event
   */
  publish<T extends EventPayload>(event: Omit<T, "timestamp">): void {
    if (this.isShuttingDown) {
      logger.warn("Event bus is shutting down, event dropped", { type: event.type });
      return;
    }

    const fullEvent: EventPayload = {
      ...event,
      timestamp: new Date().toISOString(),
    } as EventPayload;

    // Emit to specific type listeners
    this.emitter.emit(event.type, fullEvent);

    // Emit to wildcard listeners
    this.emitter.emit("*", fullEvent);

    // Emit to central event stream
    this.emitter.emit("event", fullEvent);
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T extends EventPayload>(
    type: EventType | "*",
    handler: EventHandler<T>
  ): () => void {
    // Track handler for cleanup
    if (!this.handlers.has(type as EventType)) {
      this.handlers.set(type as EventType, new Set());
    }
    this.handlers.get(type as EventType)!.add(handler as EventHandler);

    // Attach listener
    this.emitter.on(type, handler);

    // Return unsubscribe function
    return () => {
      this.emitter.off(type, handler);
      this.handlers.get(type as EventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to an event type for one-time handling
   */
  once<T extends EventPayload>(
    type: EventType,
    handler: EventHandler<T>
  ): void {
    this.emitter.once(type, handler);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    logger.info("Event bus shutting down");

    // Wait for pending event handlers (give them 5 seconds)
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn("Event bus shutdown timeout, forcing close");
        resolve();
      }, 5000);

      // Clear all listeners
      this.emitter.removeAllListeners();
      this.handlers.clear();

      clearTimeout(timeout);
      resolve();
    });

    logger.info("Event bus shutdown complete");
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(type?: EventType): number {
    if (type) {
      return this.emitter.listenerCount(type);
    }
    return this.emitter.listenerCount("event");
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Convenience functions
export const publish = <T extends EventPayload>(event: Omit<T, "timestamp">) =>
  eventBus.publish(event);

export const subscribe = <T extends EventPayload>(
  type: EventType | "*",
  handler: EventHandler<T>
) => eventBus.subscribe(type, handler);

// Pre-configured event publishers
export const events = {
  user: {
    created: (userId: string, email: string, source = "api") =>
      publish<UserEvent>({
        type: "user.created",
        source,
        data: { userId, email },
      }),
    updated: (userId: string, source = "api") =>
      publish<UserEvent>({
        type: "user.updated",
        source,
        data: { userId },
      }),
    deleted: (userId: string, source = "api") =>
      publish<UserEvent>({
        type: "user.deleted",
        source,
        data: { userId },
      }),
  },

  product: {
    created: (productId: string, slug: string, source = "api") =>
      publish<ProductEvent>({
        type: "product.created",
        source,
        data: { productId, slug },
      }),
    updated: (productId: string, source = "api") =>
      publish<ProductEvent>({
        type: "product.updated",
        source,
        data: { productId },
      }),
    deleted: (productId: string, source = "api") =>
      publish<ProductEvent>({
        type: "product.deleted",
        source,
        data: { productId },
      }),
  },

  cache: {
    invalidate: (keys: string[], source = "system") =>
      publish<CacheInvalidateEvent>({
        type: "cache.invalidate",
        source,
        data: { keys },
      }),
  },

  audit: {
    log: (
      action: string,
      resource: string,
      userId?: string,
      details?: Record<string, unknown>,
      source = "api"
    ) =>
      publish<AuditEvent>({
        type: "audit.log",
        source,
        data: { userId, action, resource, details },
      }),
  },
};

export default eventBus;
