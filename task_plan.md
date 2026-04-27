# Task Plan: Performance Optimization & Bug Fixes

## 1. Fix Critical Crashes
- [ ] Wrap `root.tsx` with `InquiryCartProvider`.
- [ ] Verify Products page loads without errors.

## 2. Resolve Asset Issues
- [ ] Identify and replace 404 image links on the homepage.
- [ ] Verify image rendering.

## 3. Performance Analysis (Deep Dive)
- [ ] Audit `vendor-3d` bundle usage.
- [ ] Check if `LazyUnifiedModelViewer` is truly code-split or if the library is leaking into the main bundle.

## 4. Verification
- [ ] Run `npm run check:bundle` after fixes.
- [ ] Browser test Products page and Homepage.
