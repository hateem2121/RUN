# Performance & Caching layer - Investigative Audit Task Plan

## Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`.
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`.

## B.L.A.S.T. Execution Order
- [x] **B** Blueprint: Read `server/middleware/ssr-cache.ts` completely. Map all cache keys, TTLs, and invalidation triggers.
- [x] **L** Link: Verify L1 and L2 cache are populated correctly for each batch endpoint. Check that cache key includes any varying parameters (locale, user role).
- [x] **A** Architect: Run `/benchmark` across all public routes. Identify LCP, CLS, INP, TTFB outliers.
- [x] **S** Stylize: Audit Vite 8 Rolldown chunk output — identify oversized chunks, unnecessary code splitting, or shared chunk misconfigurations.
- [x] **T** Trigger: Do NOT deploy. Compile findings and halt.

## Investigation Scope
- [x] 1. SSR Cache Middleware (`ssr-cache.ts`)
- [x] 2. L1 Cache (`lru-cache`)
- [x] 3. L2 Cache (Upstash Redis)
- [x] 4. Batch Cache Endpoints
- [x] 5. Vite 8 / Rolldown Bundle Analysis
- [x] 6. Web Vitals Pipeline
- [x] 7. Runtime Profiling (react-scan)
- [x] 8. GC & System Metrics
- [x] 9. Database Query Performance
- [x] 10. Image & Asset Delivery
