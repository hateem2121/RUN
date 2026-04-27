# Task Plan

## Active Tasks

*All 10 code review findings resolved. Ready for next sprint.*
* **Remediating Smooth Scroll Crash**: Successfully consolidated `LocomotiveScroll` v5 usage across all routes, migrated the homepage, and added a destruction safety net.

---

## Current Sprint Backlog

**Completed 2026-04-14: 5-Lens Review Remediation**
- Rate limiter stub replaced with production `createRateLimiter()` middleware
- Featured products pagination moved to DB-level LIMIT/OFFSET
- Webhook `z.any()` removed — typed with `WebhookPayloadMap` discriminated union
- Homepage batch stale comment rewritten; `(p: any)` cast replaced with `HomepageProcessCard`
- Slug validation added to admin check-slug endpoint
- Redundant `as string` casts removed from products route
- CustomDropdown focus return fixed for Tab/Escape
- Tailwind V4 arbitrary opacity values tokenized via `@utility`
  - Tech debt documented in `findings.md`: 3 monolithic files (1,235/1,120/2,367 LOC)

**Completed 2026-04-27: Epic Architecture Decoupling & Protocol 0 Lockdown (Paths A, B, C, D)**
- **Path A**: Upgraded `gstack` from `v1.6.1.0` to `v1.15.0.0`. Refactored `ProductCreateEditModal.tsx` (~1,235 LOC) via Provider Pattern, Zod validation, and `useProductQueries`.
- **Path B**: Extracted the `PageContentRepository` monolith (2,400 LOC) into five domain-specific repositories (`homepage`, `about`, `sustainability`, `manufacturing`, `technology`). Updated global API and Vitest mocks to consume decoupled structure.
- **Path C**: Tech Integrity Cleanup. Resolved `@tootallnate/once` vulnerability via `@google-cloud/storage` upgrade. Configured strict test-file `biome.json` overrides. Auto-fixed unused variables. Refactored 11 `noExplicitAny` violations in admin components. `verify:tech-integrity` executed with Exit Code 0 (0 TS errors, 0 Biome errors).
- **Path D**: Media Library Decomposition. Extracted `MediaUploadEnhanced.tsx` (1,106→618), `MediaLibraryContextEnhanced.tsx` (1,016→588), `MediaGrid.tsx` (315→143). Created 6 new focused modules: `upload-utilities.ts`, `UploadItem.tsx`, `useMediaFilters.ts`, `useMediaSelection.ts`, `useMediaUrlSync.ts`, `useMediaGridQuery.ts`. **Tech Debt ledger: ZERO remaining items.**

---

## Completed (Prior Sessions)

| Session | Items Fixed |
|---------|------------|
| 2026-03-27 (Session 1) | C1 (npm install), C2 (e2e.yml port 5002), C3 (try/catch ~50→31), H1 (any types), OTel dedup, cache stampede |
| 2026-03-28 (Session 2) | H2 (noExplicitAny: error), Migration history, framer-motion → GSAP (73 files), Biome 0 errors |
| 2026-04-03 (Session 3) | TypeScript regression → 0 errors, db.server.ts removed, debug files removed, cloudbuild /api/health fixed, CORS restored |
| 2026-04-04 (Session 4 — Audit) | Third-pass architecture audit. Score 7.5/10 (up from 6.7). 3C/6H/10M/3L findings. All 23 domains covered. |
| 2026-04-07 (Session 5 — Review) | **Consultation Session**: Antigravity review of current setup. Validated technical integrity and prioritized Critical remediation items. |
| 2026-04-07 (Session 6 — Audit) | * **Manufacturing API**: 29/29 tests PASS.
* **Batch Endpoint Latency**: Verified caching behavior and fallback resilience.
* **Protocol compliance**: Protocol 0 and Port 5002 verified.
* **Testing Coverage**: Identified gaps in Fabrics, Accessories, Size Charts, and Media Asset management modules. |
| 2026-04-14 (Session 7 — 5-Lens Review Remediation) | 10 code review findings resolved: rate limiter stub, featured products pagination, webhook z.any(), stale comment, (p: any) cast, slug validation, as string casts, CustomDropdown focus, Tailwind arbitrary values, tech debt docs. Tests: 63/63 product-repo, 51/51 services. |
| 2026-04-27 (Session 8 — Epic Decoupling & Security) | gstack v1.15.0.0. **Path A:** `ProductCreateEditModal.tsx` refactored. **Path B:** `PageContentRepository` split into 5 modules. **Path C:** Tech Integrity (Biome 0 errors, npm audit patched, strict types enforced). **Path D:** Media Library decomposed (3 monoliths → 6 new modules). Tech Debt ledger: **ZERO**. |
