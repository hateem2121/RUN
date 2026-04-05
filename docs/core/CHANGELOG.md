# Changelog

## [Unreleased] - 2026-04-04

### Added

- K8s deployment configuration with separated liveness and readiness probes.
- PodDisruptionBudget for high availability during rollouts.
- 404 catch-all route ($.tsx) for proper route handling.
- USER node directive in Dockerfile for security.

### Changed

- Replaced `shrink-ray-current` with `compression` (Node 24 N-API compatibility).
- Raised Vitest coverage threshold from 70% to 80%.
- Reduced Sentry tracesSampleRate from 1.0 to 0.1 for production.
- Removed continue-on-error from CI workflows (strict mode).

### Fixed

- Logout route now properly destroys session.
- Fixed unused cache variable in test-cache.ts.
- Removed unused `three` dependency from client.

## [Unreleased] - 2026-02-16

### Added

- Comprehensive documentation audit and synchronization.
- Updated `README.md` and `docs/CODING_STANDARDS.md` to reflect actual Port 5002 enforcement in `server/server.ts`.
- Realigned `AGENTS.md` with `.agent/` directory structure and current skill library.
- Synchronized `FULL_SYSTEM_CONTEXT.json` with current tech stack versions and git commit hash.

## [v4.2.0] - Feb 13, 2026 (Database Optimization Phase 3)

- **Feat:** Implemented Hybrid L1/L2 Caching architecture via `UnifiedCache` (In-memory + Redis).
- **Feat:** Added Distributed Rate Limiting using Redis atomic counters with sliding-window support.
- **Feat:** Added support for Event-Driven Cache Invalidation across multi-region Cloud Run instances.
- **Perf:** Optimized Neon PostgreSQL connection pooling and added circuit breaker protection (`opossum`).
- **Security:** Enhanced session management with distributed storage in Upstash Redis.
- **Docs:** Updated `README.md` and `DEVELOPMENT_WORKFLOW.md` to reflect tiered caching and rate limiting standards.

## [v4.1.1] - Feb 5, 2026 (Documentation Cleanup)

- **Docs:** Completed comprehensive audit of all documentation and scripts.
- **Docs:** Modernized `README.md` and `overview.md` with current `/api/v1` base URLs.
- **Docs:** Updated `upgrade-playbook.md` with React Router 7 and semantic z-index standards.
- **Refactor:** Removed transient log files and obsolete component documentation.
- **Style:** Standardized category dot colors and optimized Hero section for mobile responsiveness.

## [v4.1.0] - Jan 5, 2026 (System Improvements)

**Phase 1: Quick Wins (+8 points)**

- **Fix:** Consolidated duplicate rate limiter files into `rateLimiter.ts`
- **Feat:** Added Redis circuit breaker protection to L2 cache
- **Security:** Implemented session ID regeneration on OAuth callback
- **CI:** Added bundle size budget enforcement

**Phase 2: Architecture Verification (+12 points)**

- Verified repository-pattern architecture (7 repositories, 21 component folders)
- Confirmed `DirectPostgreSQLStorage` as proper facade pattern

**Phase 3: Performance & Reliability (+10 points)**

- **Feat:** Added SSR edge caching middleware for public pages
- **Docs:** Created horizontal scaling documentation

**Phase 4: Observability & DX (+6 points)**

- **CI:** Added synthetic monitoring GitHub workflow
- **Feat:** Created SLO alerting module with Sentry integration
- **Docs:** Enhanced SLO documentation with runbooks
- **CI:** Added Dependabot configuration for automated updates
- **Docs:** Created maintenance runbook

### [v4.0.0] - Dec 23, 2025 (Tailwind v4 Migration)

- **Feat:** Upgraded to Tailwind CSS v4.0 ("Oxide" Engine).
- **Fix:** Resolved Z-index race conditions between Staggered Menu and Modals.
- **Fix:** Corrected invalid CSS syntax in map animations.
- **Refactor:** Removed redundant grow-0 flex props and duplicate CSS imports.

### [Late 2025 Tooling Upgrade] - Dec 23, 2025

- **Removed:** Static security binaries (Trivy) to reduce bloat.
- **Added:** Bruno (API Client), Lighthouse CI (Performance), Turbo Console Log (Debug).
- **CI/CD:** Established GitHub Actions "Quality Gate" for Linux-based performance testing.
