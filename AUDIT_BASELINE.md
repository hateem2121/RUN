# UI Audit Baseline (AUDIT_BASELINE.md)

**Date**: December 18, 2025
**Environment**:

- **Node**: v22.14.0
- **NPM**: 10.9.2
- **OS**: macOS
- **Browser**: Chromium (headless)

## Dependency Delta (Summary)

Significant upgrades from React 18 -> 19 and Tailwind v3 -> v4 have occurred.

| Package       | Current Version | Base Version (Estimated) | Status   |
| ------------- | --------------- | ------------------------ | -------- |
| react         | ^19.0.0         | 18.x                     | Upgraded |
| vite          | ^7.1.12         | 5.x/6.x                  | Upgraded |
| tailwindcss   | ^4.0.0          | 3.x                      | Upgraded |
| framer-motion | 12.23.26        | 10.x/11.x                | Upgraded |

## Visual Issue Matrix

| Screen      | Issue Type      | Severity | Description                                                         | Reproducibility                     |
| ----------- | --------------- | -------- | ------------------------------------------------------------------- | ----------------------------------- |
| Homepage    | Rendering/Logic | Medium   | Counter/Ticker shows extra "000" (e.g., "135000" instead of "135"). | 100% on scroll to Heritage section. |
| /test-fixes | Layout          | Low      | "React 19 Ref Forwarding" button overlaps header text.              | 100% on page load.                  |
| Global      | Style           | High     | `tailwindImported: false` reported in console audit.                | 100% on load.                       |
| Global      | Performance     | High     | LCP/FCP > 17s during dev initialization.                            | 100% first load.                    |
| Global      | Assets          | Low      | `NeueStance-Regular.ttf` preloaded but unused.                      | 100% (Console warning).             |

## Reproduction Steps

1. `npm run dev`
2. Open `http://localhost:5001`
3. Scroll to "Heritage" section to see ticker bug.
4. Navigate to `/test-fixes` to see layout overlap.
5. Check console for `Style Audit` log.

## Next Tracks

- **Track A**: Investigate `Counter` component and React 19 effect behavior.
- **Track B**: Audit Tailwind v4 integration (Vite plugin vs PostCSS).
- **Track C**: Investigate bundle size and splash screen blockage.
