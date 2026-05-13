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
**Protocol 0 active.**
