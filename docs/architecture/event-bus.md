# Event Bus Architecture

Lightweight event-driven architecture for audit logging, cache invalidation, and future microservices integration.

## Overview

The event bus provides publish/subscribe capability within the server process:

```
┌─────────────┐     publish()      ┌─────────────┐
│  Services   │ ─────────────────► │  Event Bus  │
└─────────────┘                    └──────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
           │ Audit Logger│       │Cache Invalidate│    │ Future: Queue│
           └─────────────┘       └─────────────┘       └─────────────┘
```

## Location

```
server/lib/events/event-bus.ts
```

## Usage

### Publishing Events

```typescript
import { events } from "../lib/events/event-bus.js";

// User events
events.user.created(userId, email);
events.user.updated(userId);
events.user.deleted(userId);

// Product events
events.product.created(productId, slug);
events.product.updated(productId);

// Cache invalidation
events.cache.invalidate(["products:*", "categories:all"]);

// Audit logging
events.audit.log("UPDATE", "products", userId, { productId });
```

### Subscribing to Events

```typescript
import { subscribe } from "../lib/events/event-bus.js";

// Subscribe to specific event type
const unsubscribe = subscribe("user.created", (event) => {
  console.log("New user:", event.data.userId);
});

// Subscribe to all events
subscribe("*", (event) => {
  console.log("Event:", event.type);
});

// Cleanup
unsubscribe();
```

## Event Types

| Event Type | Data | Use Case |
|------------|------|----------|
| `user.created` | `{ userId, email }` | Welcome email, analytics |
| `user.updated` | `{ userId }` | Cache invalidation |
| `user.deleted` | `{ userId }` | GDPR cleanup |
| `product.created` | `{ productId, slug }` | Index update |
| `product.updated` | `{ productId }` | Cache invalidation |
| `cache.invalidate` | `{ keys: string[] }` | Multi-tier cache sync |
| `audit.log` | `{ action, resource, userId, details }` | Compliance logging |

## Design Decisions

**Why in-memory?**
- Simple, no infrastructure dependency
- Sufficient for current monolith scale
- Can migrate to Redis Pub/Sub or Cloud Pub/Sub when needed

**Future roadmap:**
- Redis Pub/Sub for distributed events
- Cloud Pub/Sub for async job processing
- Event store for event sourcing patterns

## Related

- ADR-002: Event-Driven Architecture (planned)
- [Caching Strategy](../core/architecture.md#caching)
