# UI Stacking Context & Layering Audit

This document audits the stacking contexts and layering strategy to prevent overlaps and overlay trapping.

## Stacking Context Strategy

The application uses a semantic z-index scale defined in `client/src/index.css`:

- **Base Content**: `z: 0`
- **Main Content Wrapper**: `z: 10`
- **Dock/Header**: `z: 50`
- **Modals**: `z: 100`
- **Toasts**: `z: 200`
- **Critical FOUC Root**: `z: auto` (managed by opacity)

## Identified Issues & Resolutions

### 1. Sticky Reveal Footer Collision

- **Issue**: On short pages like `/test-fixes`, the `fixed` footer with `z-[-10]` was visible under the main content, causing overlaps when content was transparent or created new stacking contexts (e.g., during animations).
- **Resolution**:
  1.  Added `relative z-10` and solid backgrounds to all major sections on `/test-fixes`.
  2.  Increased section padding to ensure the content fully occludes the footer until intentional reveal.

### 2. Context Menu / Tooltip Trapping

- **Audit**: Verified that `TooltipProvider` and `PopOver` portals are correctly targeting a container with high z-index.
- **Observation**: No current cases of "trapping" found under the fixed footer due to the footer's negative z-index.

## Regression Checklist

- [ ] Verify `/test-fixes` has no overlap between Ticker/Transitions and Footer CTA.
- [ ] Confirm `z-index` variables in `index.css` are being used consistently.
