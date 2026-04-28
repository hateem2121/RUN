# Task Plan: Performance Optimization & Bug Fixes

## 1. Fix Critical Crashes
- [ ] Wrap `root.tsx` with `InquiryCartProvider`.
- [ ] Verify Products page loads without errors.

## 2. Resolve Asset Issues
- [ ] Identify and replace 404 image links on the homepage.
- [ ] Verify image rendering.

## 3. Performance Analysis (Deep Dive)
- [x] Audit `vendor-3d` bundle usage. (Findings: 1.01MB, expected)
- [x] Check if `LazyUnifiedModelViewer` is truly code-split. (Findings: Yes)
- [x] Investigate GSAP Ticker & Skew logic in `_index.tsx`. (Optimized with quickTo)
- [x] Check for expensive GPU operations (backdrop-blur, large layers). (Optimized)
- [x] Optimize `handleScroll` to use `quickTo`.
- [x] Implement conditional ticker execution / removal.

## 4. Database & Cache Integrity (High Priority)
- [x] Harden `db.ts` with optimized timeouts and health checks.
- [x] Enhance Redis circuit breaker and error handling in `upstash-client.ts`.
- [x] Audit and standardize cache invalidation in all repositories.
- [x] Cross-reference migrations with `shared/schemas` to ensure zero drift.

## 5. Verification
- [x] Run `npm run verify:tech-integrity`.
- [x] Execute scratch script for cache invalidation testing.
- [x] Verify Admin-to-Live site synchronization.
