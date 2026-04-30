# Pre-Fix Baseline Performance Benchmark

**Date**: 2026-04-30  
**Status**: Pre-Fix Baseline  
**URL**: `http://localhost:5002/`

## Core Metrics

| Metric | Value | Status |
| :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | 1,432 ms | ✅ GOOD |
| **CLS** (Cumulative Layout Shift) | 2.026 | ❌ CRITICAL |
| **TBT** (Total Blocking Time) | 12 ms | ✅ GOOD |
| **Average FPS** (Scroll) | ~60 fps | ✅ GOOD |
| **Long Tasks** (>50ms) | 1 detected | ✅ GOOD |

## Page Composition

- **DOM Nodes**: 742
- **`will-change` Elements**: 19
- **`backdrop-filter` Elements**: 32

## Observations

1. **Extreme CLS**: The layout shifts are significantly higher than the 0.1 target. This confirms the "jank" reported by the user, specifically during the transition from the preloader to the hero section.
2. **GPU Pressure**: 32 elements with `backdrop-filter` is a high number for a mobile-first B2B site. This correlates with the HSR-004 finding.
3. **Redundant `will-change`**: 19 elements using `will-change` might be causing excessive memory usage, potentially leading to stutter on lower-end devices.
4. **CSP Issues**: Console logs indicate font blocking for `NeueStance-Bold.ttf`, which explains the FOUT (Flash of Unstyled Text) and CLS jumps.

---
*This baseline will be used to measure the success of the Homepage Smoothness Fix Sprint.*
