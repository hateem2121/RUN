# SOP: Performance Monitoring & SWR (v1.0.0)

## 1. Overview

The **RUN Remix** architecture maintains a 100/100 performance score through a deterministic Hybrid SWR (Stale-While-Revalidate) strategy. This SOP defines cache tiers and monitoring metrics to ensure system performance remains at its peak.

## 2. Hybrid SWR Strategy

Caches are layered to minimize latency and database compute time (Neon).

### L1: Local Memory (LRUCache)

- **Tool:** `lru-cache` v11.x.
- **Latency:** <1ms.
- **Scope:** Individual node instances.
- **Usage:** Hot data, frequent permissions checks (e.g., `AdminCache`).

### L2: Global Distributed (Redis)

- **Tool:** Upstash Redis (serverless).
- **Latency:** ~20-50ms (cross-region).
- **Scope:** Unified across all server instances.
- **Usage:** Shared session data, persistent configuration.

### SWR Flow

1. **Try L1:** If HIT, return immediately.
2. **Try L2:** If HIT, update L1 and return.
3. **Try Database:** If HIT, update L1 and L2 and return.
4. **Revalidate:** Periodically refresh cache in the background (background worker).

## 3. Monitoring & Metrics

Use **OpenTelemetry** and custom health checks to track performance.

- **[METRIC] Cache Hit Rate:** Aim for >90% hit rate on frequent lookups.
- **[METRIC] P95 Response Time:** Aim for <200ms for all API endpoints.
- **[METRIC] Error Rate:** Aim for <0.1% error rate on all service calls.

## 4. Implementation Standards

- **[RULE] Unified Cache Client:** All caching MUST use `UnifiedCache` in [unified-cache.ts](file:///Users/hateemjamshaid/Sites/RUN/server/lib/cache/unified-cache.ts).
- **[RULE] No Cache Bypassing:** Use cache keys based on consistent Zod schemas.
- **[RULE] Circuit Breaker:** Use circuit breakers on all Redis and Database calls to prevent cascading failures.

---
**Status:** ACTIVE | **Approver:** Antigravity System
