# Task Plan — Performance Remediation (100/100)

## Status: SYSTEM INTEGRITY VERIFICATION & AUDIT REVIEW (Session Goal: Verify all tests pass, check system connectivity/ports, and review findings - 2026-05-25) [COMPLETED]
**Finding ID Prefix:** `PC-`

---

## 1. SSR & Cache Layer [x]
- [x] Implement Vary-aware keys in `ssr-cache.ts`.
- [x] Reduce L1 cache size in `unified-cache.ts` (50MB).
- [x] Fix `X-SSR-Cache` header logic.

---

## 2. Bundle & 3D Optimization [x]
- [x] Isolate `model-viewer` in dedicated async chunk.
- [x] Enable Brotli compression in Vite config.
- [x] Implement `Suspense` for 3D viewer.

---

## 3. Analytics & Infrastructure [x]
- [x] Fix `sendBeacon` Content-Type in `web-vitals.ts`.
- [x] Add database indices for slow queries.
- [x] Update Hero assets (eager loading, srcset).

---

## 4. Verification [x]
- [x] Run `npm run verify:tech-integrity`.
- [x] Run `npm run verify:connect` (with standard local fallbacks).
- [x] Verify bundle splitting (`vendor-3d`).
- [x] Run automated test suite (`test`).
- [x] Final 100/100 Health Check.

---

---

## 5. Performance & Caching Audit (PC-AUDIT) [x]
- [x] B.L.A.S.T. Phase 1: Blueprint (SSR Cache Mapping)
- [x] B.L.A.S.T. Phase 2: Link (L1/L2 Verification)
- [x] B.L.A.S.T. Phase 3: Architect (Benchmark/QA)
- [x] B.L.A.S.T. Phase 4: Stylize (Bundle Analysis)
- [x] B.L.A.S.T. Phase 5: Trigger (Final Findings)


## 6. Performance Remediation (PC-REMEDIATION) [x]
- [x] Research & Plan Resolution
- [x] Implement Vite Compression & Chunk Fragmentation (PC-010)
- [x] Implement Postgres-backed L2 Cache for Distributed Sync (PC-011) [RESOLVED]
- [x] Self-host fonts (Inter, Material Symbols) (PC-019)
- [x] Enable pre-compressed asset serving in Express (PC-020)
- [x] Final Verification & Health Check

## 7. Performance & Caching Audit — Phase 2 (PC-AUDIT-V2) [x]
- [x] [B] Map SSR Cache Keys & TTLs
- [x] [L] Verify L1/L2 Population & Distributed Sync
- [x] [A] Run Benchmarks & Outlier Detection
- [x] [S] Audit Rolldown Bundle & Chunking (Post-Fix)
- [x] [T] Final Validation & Findings Update

## 8. Port 5001 Inquiry [x]
- [x] Investigate port config files and environment variables.
- [x] Identify running processes on port 5001 and port 5002.
- [x] Verify port compliance in the whole system.
- [x] Finalize findings and explain to the user.

## 9. Codebase Health Check [x]
- [x] Run typecheck and lint checks.
- [x] Run test suite.
- [x] Document findings and advise the user.

## 10. Outstanding Technical Debt [x]
- [x] Fix P2 product counts cache invalidation bug.
- [x] Fix P2 idempotency middleware hardening.
- [x] Add P3 CustomDropdown keyboard E2E tests.

---

## 11. Repository Cleanup & Technical Debt Resolution [x]
- [x] Delete unused client-side files (developer.guides..tsx, MarqueeStrip.tsx, performance.ts).
- [x] Delete unused server-side files (services.ts, circuit-breaker.ts).
- [x] Prune unused client and server package dependencies.
- [x] Resolve resulting unlisted OTEL dependencies compile errors.
- [x] Run `npm run verify:tech-integrity` and verify E2E test suite.

---
**Protocol 0 active.**

