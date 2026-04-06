# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `/about` page no longer shows an infinite loading spinner when the API is unavailable — now shows a clear "Unable to load about page" error with a Retry button (`client/app/routes/about.tsx`)

### Changed
- Updated vendored gstack from v0.15.4.0 to v0.15.15.0 (includes browse cookie picker UI, platform detection improvements, telemetry fixes)
- Added "Server No-Watch" launch config to `.claude/launch.json` for worktree development (prevents tsx watch restart loop from Vite temp files)

### Added
- `connect-chrome` skill directory added to `.claude/skills/`

## [4.0.0] - 2026-04-04

### Added
- PodDisruptionBudget for K8s deployments (minAvailable: 1)
- Separate health check endpoints: `/healthz` (liveness), `/readyz` (readiness)
- 404 catch-all route (`$.tsx`) for unmatched paths
- CHANGELOG.md for release tracking
- ADR-0017: GSAP over Framer Motion decision record

### Changed
- Replaced `shrink-ray-current` with `compression` for HTTP compression
- Raised Vitest coverage thresholds: lines/functions/statements to 80%, branches to 75%
- Sentry `tracesSampleRate` reduced to 0.1 in production
- Logout route changed from GET to POST with session destruction
- Replaced `console.log/warn/error` with Pino logger in server bootstrap
- Dockerfile now runs as non-root `USER node`
- Single-branch model: all work on `main` (no feature branches)

### Removed
- `request`, `node-zopfli-es`, `shrink-ray-current` from dependencies
- `three` from client dependencies (using `@google/model-viewer` only)
- `continue-on-error: true` from CI workflow lint, security, and docs steps
- Route-level try/catch from `/api/health/db` endpoint (Express 5 pattern)

### Security
- Eliminated 2 critical and 1 high npm audit vulnerabilities
- Added session destruction on logout
- Clear session cookie on logout

## [3.0.0] - 2026-03-31

### Added
- Agentic Sportswear Factory v3.0.0
- B.L.A.S.T. Protocol integration
- Neon Serverless Postgres via Drizzle ORM
