# Horizontal Scaling Guide

This document describes how to scale the RUN Apparel B2B Platform horizontally on Google Cloud Run.

## Architecture Overview

The platform is designed for horizontal scaling with the following considerations:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Load Balancer                       │
│                    (+ Cloud Armor DDoS)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Cloud Run   │     │   Cloud Run   │     │   Cloud Run   │
│  Instance 1   │     │  Instance 2   │     │  Instance N   │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Upstash Redis │     │ Neon Postgres │     │ Replit Object │
│   (L2 Cache)  │     │  (Serverless) │     │    Storage    │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Scaling Configuration

### Cloud Run Settings

```yaml
# cloudbuild.yaml scaling configuration
spec:
  template:
    metadata:
      annotations:
        # Auto-scaling
        autoscaling.knative.dev/minScale: "1" # Minimum instances
        autoscaling.knative.dev/maxScale: "10" # Maximum instances

        # Concurrency
        autoscaling.knative.dev/target: "80" # Target concurrent requests

        # CPU allocation
        run.googleapis.com/cpu-throttling: "false" # Always-on CPU
```

### Recommended Settings by Traffic

| Traffic Level        | Min Instances | Max Instances | Memory | CPU |
| -------------------- | ------------- | ------------- | ------ | --- |
| Low (<100 RPM)       | 0-1           | 3             | 512MB  | 1   |
| Medium (100-1K RPM)  | 1             | 5             | 1GB    | 1-2 |
| High (1K-10K RPM)    | 2             | 10            | 2GB    | 2   |
| Very High (>10K RPM) | 3             | 20            | 2GB    | 2-4 |

## Session Affinity

Cloud Run provides session affinity through cookies:

```yaml
annotations:
  run.googleapis.com/sessionAffinity: "true"
```

> [!IMPORTANT]
> Session affinity is best-effort, not guaranteed. Always design for stateless operation.

## Cache Consistency

### L1 Cache (In-Memory)

Each instance maintains its own L1 LRU cache. On horizontal scaling:

- **Read operations:** May serve stale data briefly (60s TTL)
- **Write operations:** Invalidate L2 (Redis), L1 expires naturally
- **Mitigation:** Short TTLs + SWR pattern ensure eventual consistency

### L2 Cache (Upstash Redis)

Shared across all instances:

- **Consistency:** Strong - all instances see same data
- **Circuit breaker:** Falls back to L1-only on Redis failure
- **Compression:** Large payloads (>1KB) are gzip compressed

### Cache Invalidation Strategy

```typescript
// On write operations, invalidate L2 immediately
await unifiedCache.clearPattern(`products:*`);
// L1 entries expire naturally within TTL
```

## Database Connection Pooling

### Neon Serverless

Neon handles connection pooling automatically via HTTP driver:

- **Max concurrent:** 50 queries (enforced in db.ts)
- **Circuit breaker:** Opens after 50% failure rate
- **Cold start:** Database wakeup job runs on boot

### Connection Limits

```typescript
// server/db.ts
const MAX_CONCURRENT_QUERIES = 50;

// Each Cloud Run instance enforces this limit independently
// With 10 instances: theoretical max 500 concurrent queries
```

## Graceful Shutdown

Cloud Run sends SIGTERM before terminating instances:

```typescript
// server/server.ts
async function gracefulShutdown(signal: string) {
  logger.info(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new requests
  server.close();

  // Wait for in-flight requests (up to 10s)
  await Promise.race([
    waitForDrain(),
    new Promise((r) => setTimeout(r, 10000)),
  ]);

  process.exit(0);
}
```

## Health Checks

Cloud Run uses `/health` endpoint for liveness:

```typescript
// Endpoint: GET /health
// Response: 200 OK with service status

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

## Troubleshooting

### Cold Start Latency

**Symptom:** First request after scale-up is slow (2-5s)

**Solutions:**

1. Set `minScale: 1` to keep one instance warm
2. Enable CPU always-on: `run.googleapis.com/cpu-throttling: "false"`
3. Pre-warm database on boot (already implemented)

### Cache Stampede

**Symptom:** Multiple instances hit DB simultaneously on cache miss

**Solutions:**

1. SWR pattern with probabilistic revalidation (implemented)
2. Cache warmup on boot via `CacheWarmupRegistry`
3. Staggered TTLs with jitter

### Rate Limiting Inconsistency

**Symptom:** Rate limits not enforced accurately across instances

**Solutions:**

1. Use Redis-backed rate limiting in production (implemented)
2. Each instance falls back to in-memory if Redis fails
3. Consider moving to Cloud Armor for edge rate limiting

## Monitoring Horizontal Scaling

### Key Metrics to Watch

```yaml
# Instance count
container/instance_count

# Request latency P99
request/latencies{percentile="p99"}

# Cold start frequency
startup_latencies

# Circuit breaker trips
custom.googleapis.com/circuit_breaker/state
```

### Alerts

Set alerts for:

- Instance count > 80% of max
- Cold start latency > 5s
- Database circuit breaker OPEN
- Redis circuit breaker OPEN
