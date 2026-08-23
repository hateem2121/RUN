# Visual Auditing, Fluid Typography & Accessibility Invariants Rule

This rule defines mandatory guardrails for responsive UI development, fluid typography scaling, automated screenshot capture harnesses, and WCAG 2.2 accessibility compliance across the RUN APPAREL CMS monorepo.

## 1. Fluid Display Typography Clamp Bounds
- Any custom fluid typography token registered under `@theme` inside `client/app/styles/theme.css` (e.g., `--text-display-xl`, `--text-display-2xl`) consumed by uppercase brutalist display headings MUST clamp the mobile minimum bound to `≤ 2.125rem` (34px).
- Never use minimum bounds `>= 3rem` for mobile display titles, as uppercase words longer than 8 characters will clip or wrap on 375px mobile viewports.

## 2. Admin Visual Capture Authentication
- Screenshot capture harnesses and visual regression tests targeting `/admin/*` routes MUST route through `/api/auth/mock-login?returnTo=${encodeURIComponent(route)}`.
- The capture script MUST explicitly assert via `page.waitForFunction()` that loading indicators (`Checking access...`, `Loading module...`) have unmounted and table/card DOM structures are fully rendered before capturing snapshots.

## 3. WCAG 2.2 Success Criteria Invariants
- **SC 2.4.11 (Focus Not Obscured - Level AA)**: All scroll containers in layouts featuring sticky or floating dock headers MUST declare `scroll-padding-top: 5rem` (80px) on `html` or root containers so keyboard-focused elements are never obscured by floating UI elements.
- **SC 2.5.8 (Target Size Minimum - Level AA)**: All interactive buttons, table checkboxes, modal close icons, and pagination controls MUST meet the minimum 24×24px bounding box or have adequate spacing.

## 4. Biome CSS Formatting Invariant
- All hex color codes in `.css` stylesheets MUST be lowercase (e.g., `#00d4ff`, `#ffffff`) to satisfy Biome 2.5 formatting checks without emitting CI lint errors.
