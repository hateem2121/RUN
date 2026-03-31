# Database Performance & Caching Strategy

## Overview

This document outlines the performance architecture for the RUN Remix CMS, focusing on the hybrid caching strategy, connection management, and resilience patterns used to achieve sub-100ms response times.

## 1. Caching Strategy

We utilize a **Hybrid L1/L2 Caching** architecture (`UnifiedCache`) to balance speed and consistency.

### L1: In-Memory (Local)

- **Technology**: `lru-cache`
- **Scope**: Per-instance (Cloud Run container)
- **Speed**: <1ms (microseconds)
- **Use Case**: Hot keys, extremely high-frequency reads (e.g., navigation, feature flags)
- **Capacity**: Tuned to ~100MB / 5000 items

### L2: Distributed (Shared)

- **Technology**: Upstash Redis (Serverless)
- **Scope**: Global / Cross-instance
- **Speed**: 5-30ms (HTTP/TCP)
- **Use Case**: Shared state, rate limiting, session storage, computation results
- **Persistence**: Data survives container restarts

### Cache Patterns

- **Cache-Aside**: Application code checks cache first, then DB, then populates cache.
- **Write-Through**: `UnifiedCache` writes to L1 and L2 immediately (L2 is fire-and-forget).
- **Event-Driven Invalidation**:
  - When data changes (`create`/`update`/`delete` repositories), an event is emitted to Redis.
  - `CacheEvents` system propagates invalidations to ensure consistency across distributed instances.

## 2. Rate Limiting

Implemented via `RateLimiter` class using Redis atomic counters.

| Tier | Limit | Window | Scope |
|------|-------|--------|-------|
| **General** | 100 req | 15 min | IP-based protection for public APIs |
| **Admin** | 30 req | 15 min | Stricter limit for sensitive operations |
| **Diagnostic** | 10 req | 1 min | Internal health/metrics endpoints |

**Fallback**: If Redis is unavailable, rate limiting falls back to in-memory tracing (per instance), failing open if necessary to preserve availability.

## 3. Resilience & Circuit Breakers

To protect against cascading failures (e.g., DB outages or Redis latency spikes), we use the `CircuitBreaker` pattern (`opossum`).

### Configuration

| Service | Timeout | Error Threshold | Reset Timeout |
|---------|---------|-----------------|---------------|
| **Database** | 10s | 50% | 30s |
| **Redis** | 3s | 50% | 15s |
| **External API** | 5s | 40% | 60s |

**Behavior**:

- **Closed**: Normal operation.
- **Open**: Fails fast (throws error immediately) to allow downstream service to recover.
- **Half-Open**: Allows trial requests to check if service has recovered.

## 4. Database Optimization (Neon PostgreSQL)

### Connection Management

- **Pooling**: Built-in Neon serverless driver handling.
- **Lazy Initialization**: Connections are established only on first request.
- **Keep-Alive**: Background pings to prevent cold starts during low traffic (`server/lib/db/keep-alive.ts`).

### Indexing Guidelines

- **Foreign Keys**: ALWAYS index columns used in FK relationships (`categoryId`, `userId`).
- **Filters**: Index columns frequently used in `WHERE` clauses (e.g., `slug`, `isActive`).
- **Sorting**: Composite indexes for `ORDER BY` + `LIMIT` queries (e.g., `(createdAt DESC, id)`).

## 5. Monitoring (OpenTelemetry)

- **Spans**: Database queries and Cache operations are traced.
- **Attributes**: Look for `db.statement`, `cache.hit`, `rate_limit.result` in traces.
- **Metrics**: Connection pool stats and Cache hit rates are logged via `logger`.
