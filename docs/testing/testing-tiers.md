# Testing Strategy & Tiers

## Overview

This project employs a tiered testing strategy to ensure reliability without sacrificing developer velocity.

## Tiers

### 1. Unit & Static Analysis (`npm test`, `npm run check`)

- **Scope**: Individual functions, hooks, components.
- **Environment**: In-process (Vitest, TSC).
- **External Deps**: Mocked.
- **Frequency**: On every commit / save.
- **Fail Check**: `ci.yml` (Lint/Typecheck/Unit).

### 2. Integration Hardening (`npm run test:integration`)

- **Scope**: Critical system behaviors (Crash integrity, Observability contracts).
- **Environment**: Real processes spawned locally. Real Database (Docker).
- **External Deps**: Real (Postgres).
- **Frequency**: On PR / Merge.
- **Tests**:
  - `crash.test.ts`: Verifies `process.exit(1)` on uncaught errors.
  - `slow-query.test.ts`: Verifies `[Slow Query]` logs using real DB delays.

### 3. End-to-End (`npm run test:e2e`)

- **Scope**: Full user flows (Checkout, Login).
- **Environment**: Playwright against running app.

## Running Integration Tests Locally

### Prerequisites

- Docker (for Postgres)

### Steps

1. Start Test Database:

   ```bash
   docker compose -f docker-compose.test.yml up -d
   ```

2. Run Tests:

   ```bash
   npm run test:integration
   ```

## Security Gating (Production)

Debug routes (`/api/debug/*`) are strictly managed:

1. **Dynamic Import**: The router module is only imported if `NODE_ENV !== "production"`.
2. **Explicit Enablement**: Even in non-prod, `ENABLE_DEBUG_ROUTES="true"` is required.
3. **Defense-in-Depth**:
   - **Token Gate**: `X-RUN-DEBUG-TOKEN` header must match env `DEBUG_ROUTE_TOKEN`.
   - **Network Gate**: Requests must originate from localhost unless `DEBUG_ROUTE_ALLOWLIST` is set.
4. **Verification**: `tests/integration/security.test.ts` validates 404 response in production.

## Integration Test Strategy

- **Dynamic Ports**: Tests use `PORT=0` to let the OS assign ephemeral ports, allowing parallel execution.
- **Cleanup**: Child processes are managed to ensure no orphan processes remain.

## Source Map Policy

- Production builds use `hidden` source maps.
- `scripts/verify-source-maps.ts` runs in CI to ensure no `sourceMappingURL` comments exist in `dist/`.
- Server middleware blocks access to `*.map` files in production.

## Crash-Only Verification

Located in `tests/integration/crash.test.ts`.  
Spawns the server as a child process and hits `/api/debug/crash`.
**Expected**: Server process exits with code `1`.

## Slow Query Verification

Located in `tests/integration/slow-query.test.ts`.
Spawns the server and hits `/api/debug/slow-query`.
**Expected**: Logger captures JSON warning with `durationMs > 1000`.
