---
name: neon-drizzle-edge-sql
description: |
  Serverless-optimized database patterns. Triggers:
  - "database connection", "drizzle orm", "neon http"
  - "cold start", "sql query", "schema definition"
---

# Neon & Drizzle Serverless SQL Standards

## Goal
Maximize database reliability and performance in serverless/edge environments by preventing connection exhaustion and mitigating cold starts.

## Instructions

### 1. Driver Selection
- **MANDATORY**: Use the `drizzle-orm/neon-http` driver.
- **PROHIBITED**: `pg` (node-postgres) is restricted due to TCP connection overhead in serverless environments.

### 2. Caching Implementation
Wrap read-heavy queries in the project's multi-tier caching system (Layer 1 LRU + Layer 2 Upstash Redis via `server/lib/cache/unified-cache.ts`).

### 3. Cold Start Mitigation
Pair with `react-19-optimistic-ui` on the frontend to ensure the user perceives zero latency while the Neon instance spins up.

## Constraints
- **NO** manual instantiation of PG connection pools.
- **NO** business logic in table definitions (keep shared library pure).
