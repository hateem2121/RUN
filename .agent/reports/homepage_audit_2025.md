# RUN Homepage Audit Report (2025)

## Objective
Assess the technical state of the homepage after the migration to React 19, Express 5, and Tailwind CSS v4. Identify regressions, code debt, and performance opportunities.

## I. Tailwind CSS v4 & Styling
- **Regressions**: No breaking layout issues found, but several components (e.g., `Footer.tsx`) still use `cva` with class strings that could be simplified using Tailwind v4's first-class `@theme` variables.
- **Utilities**: Custom utilities like `z-dock`, `container-centered`, and `shadow-glow-primary` are correctly defined in `index.css` but are often manually redeclared or shadowed in component-level styles.
- **Redundancy**: `client/app/styles/utilities.css` and `client/app/index.css` have overlapping `@utility` definitions.

## II. Theming & Accessibility (A11y)
- **FOUC**: The inline script in `root.tsx` correctly applies the theme class to `<html>` before hydration, effectively preventing Flash of Unstyled Content.
- **Dark Mode**: WebGL colors in `Hero.tsx` are resolved via `getComputedStyle`. If the theme changes *after* the canvas mounts, the 3D cloth material does not currently reactive-update its uniforms.
- **Interaction**: The `CustomCursor` and `Magnetic` components provide a high-end feel but lack `prefers-reduced-motion` alternates in some areas beyond `_index.tsx`.

## III. Layout & Z-Axis Stacking
- **Stacking Conexts**:
    - `z-dock` (Navigation): `9999`
    - `z-elevated` (Modals/Overlays): `50`
    - `z-base` (Content): `0`
- **Issue**: The 3D Canvas in `Hero.tsx` and the `Values.tsx` ripple effects are properly isolated, but the kinetic scroll skew in `_index.tsx` can cause "tearing" if sections overlap during fast scrolling.

## IV. API & CMS Wiring
- **Data Flow**: The homepage relies on `/api/homepage-batch` and `/api/homepage-process-cards`.
- **Latency**: Batching is efficient (target < 300ms), but the server-side cache TTL (1 hour) might be too aggressive for dev environments without manual invalidation.
- **Draft Mode**: High-priority recommendation to implement a preview mode for CMS content, as current batching ignores draft status.

## V. Code Duplication & Debt
- **Constants vs. API**: `client/app/components/homepage/constants.ts` contains hardcoded `CATEGORIES` and `FEATURED_PRODUCTS` which are *also* returned by the `homepage-batch` API. This leads to data drift.
- **Duplicated Styles**: Marquee animations are duplicated across `Categories.tsx` and `Values.tsx`.

---

## Prioritized Recommendations

### 1. High Priority (Regressions & Data)
- **Unify Data Source**: Refactor `Categories.tsx` and `FeaturedProducts.tsx` to use data from `homepage-batch` via `useRouteLoaderData('root')` or a dedicated high-level query, rather than hardcoded constants.
- **3D Theme Reactivity**: Update `OptimizedClothMaterial` in `Hero.tsx` to listen for theme change events and re-trigger color resolution.

### 2. Medium Priority (Performance & Debt)
- **Consolidate CSS**: Merge `utilities.css` into `index.css` using Tailwind v4's `@theme` and `@utility` blocks to avoid multiple imports.
- **Lazy Loading Refinement**: The `Footer` is currently skew-transformed. If the footer contains heavy WebGL (like other sections), it should be moved out of the `Suspense` boundary if its visibility is critical for SEO footer links.

### 3. Low Priority (Polish)
- **GSAP Context Cleanup**: Ensure *all* components (some missing) use `gsap.context()` for proper cleanup in React strict mode.
- **Enhanced A11y**: Add `aria-hidden` to decorative 3D elements that don't provide semantic value.
