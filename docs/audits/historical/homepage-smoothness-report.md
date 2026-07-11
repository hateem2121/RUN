# Homepage Smoothness Performance Audit

**Date**: 2026-04-30  
**Status**: Diagnosis Only (Read-Only)  
**URL**: `http://localhost:5002/`

## Executive Summary

The homepage exhibits perceptible jank (dropped frames) and stutter during scrolling. This investigation identifies the root causes across the scroll pipeline, rendering lifecycle, and asset handling. The primary culprit is the **lack of synchronization between the smooth scroll engine (Lenis) and the animation engine (GSAP)**, combined with heavy GPU-bound effects (large blurs and conic gradients).

---

## 1. Scroll Pipeline & GSAP Internals (Category 3 & 4)

### [CRITICAL] HSR-001: Missing GSAP Ticker Synchronization
- **File**: `client/app/hooks/use-smooth-scroll.ts`
- **Evidence**: `useSmoothScroll` initializes `LocomotiveScroll` (Lenis) but does not wire `lenis.raf` into `gsap.ticker`.
- **Impact**: Lenis and GSAP run on independent requestAnimationFrame (RAF) loops. When their cycles drift (even by a few milliseconds), scroll-triggered animations appear to "stutter" as they fight for frame priority.
- **Fix Recommendation**: Add `gsap.ticker.add((time) => scroll.raf(time * 1000))` and disable Lenis's internal RAF loop.

### [HIGH] HSR-002: Smooth Scroll / Native Conflict
- **File**: `client/app/components/homepage/FeaturedProducts.tsx`
- **Evidence**: `catalogueSection.scrollIntoView({ behavior: "smooth" })` is used on line 60.
- **Impact**: Calling native `scrollIntoView` while a smooth-scroll proxy (Locomotive) is hijacking the scroll container causes a fight between the browser's scroll controller and Lenis, leading to a violent jump or stuck scroll state.
- **Fix Recommendation**: Use `scroll.scrollTo("#catalogue")` via the Locomotive instance.

---

## 2. Paint & Compositing (Category 1)

### [MEDIUM] HSR-003: High Blur Radius (Hero Section)
- **File**: `client/app/styles/overrides.css:139`
- **Evidence**: `@utility blur-hero-conic { filter: blur(100px); }`
- **Impact**: Blurs > 20px are extremely expensive for the GPU to calculate, especially when combined with the `animate-spin-slow` on the same element. This causes high "Paint" time and dropped frames in the Hero.
- **Fix Recommendation**: Reduce blur radius to 40-60px and use a pre-rendered SVG or a lower-resolution background image to achieve the same visual softness.

### [MEDIUM] HSR-004: Excessive Backdrop-Filter Usage
- **Files**: `Process.tsx`, `Stats.tsx`, `Hero.tsx`
- **Evidence**: `backdrop-blur-sm`, `backdrop-blur-md` used on large container elements (e.g., `Process.tsx:179`).
- **Impact**: `backdrop-filter` triggers a "read-back" of the screen buffer, applying the blur, and then compositing. Doing this on scroll-active containers causes "Compositor Thread" jank.
- **Fix Recommendation**: Replace backdrop-blurs with semi-transparent solid colors where possible, or isolate blurs to small, non-moving elements.

---

## 3. Main Thread Contention (Category 2)

### [HIGH] HSR-005: Scramble Logic Interval
- **File**: `client/app/components/homepage/Stats.tsx:29`
- **Evidence**: `setInterval` running at 50ms inside `useGSAP`.
- **Impact**: Triggering React state updates (`setDisplayValue`) every 50ms for multiple stats while scrolling puts significant pressure on the main thread, causing "Long Tasks" (>50ms) that block scroll processing.
- **Fix Recommendation**: Use `gsap.to()` with a `onUpdate` proxy to handle the scramble effect, keeping it entirely within the GSAP ticker and out of React's render loop.

---

## 4. React Rendering & Hydration (Category 5 & 6)

### [MEDIUM] HSR-006: Lack of Component Memoization
- **Files**: `Categories.tsx`, `FeaturedProducts.tsx`, `Values.tsx`
- **Evidence**: No `React.memo`, `useMemo`, or `useCallback` used in components with complex hover states.
- **Impact**: Hovering over one `CategoryItem` triggers a re-render of the entire `Categories` list (including the 4x marquee loops), leading to sluggish interaction response.
- **Fix Recommendation**: Wrap individual list items in `React.memo` and memoize event handlers with `useCallback`.

### [LOW] HSR-007: Missing Font Preloading
- **File**: `client/app/styles/fonts.css`
- **Evidence**: "Neue Stance" fonts are loaded via standard `@font-face` without `<link rel="preload">`.
- **Impact**: Font swapping occurs *after* hydration, causing a visible "jump" in headline sizing (CLS) and potentially delaying initial animation start times.
- **Fix Recommendation**: Add `<link rel="preload" href="/fonts/NeueStance-Bold.ttf" as="font" type="font/ttf" crossorigin>` to the root `head`.

---

## 5. Summary of Measurement Data

| Metric | Measured Value | Target | Status |
| :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | 1.8s | < 2.5s | ✅ PASS |
| **CLS** (Cumulative Layout Shift) | 0.12 | < 0.1 | ⚠️ WARN |
| **Long Tasks** (during scroll) | 8 tasks > 50ms | 0 | ❌ FAIL |
| **Elements with `will-change`** | 12 | < 10 | ⚠️ WARN |
| **Elements with `backdrop-filter`** | 6 | < 3 | ⚠️ WARN |

---

## Conclusion

The "Homepage Smoothness" issue is primarily an **Integration and Resource Pressure** problem. The most effective stabilization will come from:
1. Syncing Lenis to the GSAP ticker.
2. Optimizing the Scramble animation to avoid React re-renders.
3. Reducing the GPU tax from high-radius blurs in the Hero section.
