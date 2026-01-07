# Implementation Plan - Project 100/100

# Goal Description
Execute a targeted series of architectural improvements to raise the system score from **92/100** to **100/100**. This plan addresses the identified gaps in **Reliability** (custom DB pooling risks), **Performance** (SPA vs RSC), **Maintainability** (Documentation drift), and **Developer Experience** (Tooling gaps).

## User Review Required
> [!IMPORTANT]
> **Strategic Decision: Database Layer**
> The plan proposes replacing the custom `db.ts` "Circuit Breaker" with standard `drizzle-orm/neon-http` best practices and `pg-bouncer` configuration. This removes custom complexity but requires careful load testing.
>
> **Strategic Decision: React Server Components (RSC)**
> Migrating the entire Client SPA to RSC is a massive undertaking. For this "100/100" sprint, we will focus on **Hybrid Performance Optimization** (Route-based splitting + improved caching) rather than a full rewrite, unless explicitly requested.

## Proposed Changes

### Phase 1: Developer Experience & Tooling (Score +2)
**Goal:** Fix "Not Detected" tools and enable seamless AI collaboration.

#### [NEW] [mcp.json](file:///Users/hateemjamshaid/Downloads/RUN-Remix/mcp.json)
- Create standard MCP configuration for tool discovery.

#### [NEW] [scripts/healthcheck.js](file:///Users/hateemjamshaid/Downloads/RUN-Remix/scripts/healthcheck.js)
- Explicit Node.js healthcheck script to replace `wget` dependency in Dockerfile.

#### [MODIFY] [Dockerfile](file:///Users/hateemjamshaid/Downloads/RUN-Remix/Dockerfile)
- Update HEALTHCHECK instruction to use the new script.

### Phase 2: Reliability & Database Standardization (Score +2)
**Goal:** Remove "Unknown Unknowns" from custom DB logic.

#### [MODIFY] [server/db.ts](file:///Users/hateemjamshaid/Downloads/RUN-Remix/server/db.ts)
- Simplify connection logic.
- Remove custom `trackedSql` proxy if it duplicates standard observability.
- Rely on standard Neon driver resilience.

### Phase 3: Maintainability & Documentation (Score +2)
**Goal:** Ensure documentation never drifts from reality.

#### [NEW] [scripts/generate-context.ts](file:///Users/hateemjamshaid/Downloads/RUN-Remix/scripts/generate-context.ts)
- Script to auto-generate `SYSTEM_CONTEXT.md`.
- Scans `package.json`, `docker-compose`, and cloud config.
- Updates version tables automatically.

#### [MODIFY] [package.json](file:///Users/hateemjamshaid/Downloads/RUN-Remix/package.json)
- Add `"docs:generate": "tsx scripts/generate-context.ts"` command.
- Add to `verify:tech-integrity` chain.

### Phase 4: Test Maturity & Performance (Score +2)
**Goal:** Eliminate flakes and optimize assets.

#### [MODIFY] [playwright.config.ts](file:///Users/hateemjamshaid/Downloads/RUN-Remix/playwright.config.ts)
- Tune visual regression thresholds.
- Enforce strict cleanup hooks.

#### [MODIFY] [client/vite.config.ts](file:///Users/hateemjamshaid/Downloads/RUN-Remix/client/vite.config.ts)
- Enable split vendor chunking strategy for better long-term caching.
- Configure aggressive asset caching headers.

## Verification Plan

### Automated Tests
- Run `npm run verify:tech-integrity` to ensure no regression.
- Run `npm run test:e2e` to verify Playwright stability.

### Manual Verification
- **DB Stability**: Load test the new `db.ts` implementation (simulated load).
- **Docs**: Run `npm run docs:generate` and inspect the output.
- **Healthcheck**: Verify `docker run` correctly reports health status.
