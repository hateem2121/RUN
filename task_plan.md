# Task Plan — Performance Remediation (100/100)

## Status: IN PROGRESS
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

## 4. Verification [/]
- [ ] Run `npm run verify:tech-integrity`.
- [ ] Run `npm run verify:connect`.
- [ ] Verify bundle splitting (`vendor-3d`).
- [ ] Run automated test suite (`test`, `test:e2e`).
- [ ] Final 100/100 Health Check.

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

## 7. Performance & Caching Audit — Phase 2 (PC-AUDIT-V2) [/]
- [ ] [B] Map SSR Cache Keys & TTLs
- [ ] [L] Verify L1/L2 Population & Distributed Sync
- [ ] [A] Run Benchmarks & Outlier Detection
- [ ] [S] Audit Rolldown Bundle & Chunking (Post-Fix)
- [ ] [T] Final Validation & Findings Update

---
**Protocol 0 active.**
