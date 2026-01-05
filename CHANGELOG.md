# Changelog

### [v4.1.0] - Jan 5, 2026 (System Improvements)

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
