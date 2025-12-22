# Tailwind v4 UI & Hydration Audit Report

## 1. Executive Snapshot

- **Status**: Critical regressions identified in z-index stacking, missing utilities, and hydration consistency.
- **Top 3 Issues**:
  1.  **Missing `transform-3d` Utility**: `DraggableCard` relies on a utility class that does not exist in the new v4 builds, breaking 3D effects.
  2.  **Stacking Context Collision**: `SmoothScrollLayout` (Lenis) and `FloatingDockHeader` (Fixed) are fighting for stacking context. If `Lenis` applies transforms to `html`/`body`, fixed children lose their viewport anchor.
  3.  **Legacy `space-[x/y]` Usage**: Widespread reliance on legacy spacing utilities which may behave unpredictably in complex flex layouts compared to `gap` (modern standard).
- **Hydration Risk**: `DraggableCard` uses `useIsMobile` which defaults to `false` (desktop) during SSR, causing a forced layout shift/repaint on mobile devices when hydration completes.

## 2. Findings by Category

### A. Tailwind v4 Integration

- **Status**: ✅ Correctly configured.
- **Details**:
  - Uses `@tailwindcss/vite` plugin.
  - `index.css` correctly uses `@import "tailwindcss";`.
  - Plugins (`typography`, `animate`) are loaded correctly via `@plugin`.
- **Risk**: Low.

### B. Missing Utilities (Visual Regression)

- **Symptom**: 3D cards look flat or broken.
- **Root Cause**: `transform-3d` class is used in `DraggableCard.tsx` but is **not defined** in any CSS file or Tailwind utility layer.
- **Fix**: Add custom utility.
  ```css
  @utility transform-3d {
    transform-style: preserve-3d;
  }
  ```

### C. Z-Index & Stacking Contexts

- **Symptom**: Floating headers or modals might appear _behind_ scrollable content or overlays.
- **Root Cause**:
  - `FloatingDockHeader` uses `fixed z-dock`.
  - `SmoothScrollLayout` likely creates a new stacking context on the `body` or wrapper via `Lenis` (often due to `will-change: transform` or `transform`).
  - This "traps" the fixed header inside the scrolling container's logic if not careful.
- **Trace**:
  ```mermaid
  graph TD
    Body --> SmoothScrollWrapper
    SmoothScrollWrapper --> LayoutMain
    LayoutMain --> FloatingDockHeader[FloatingDockHeader (Fixed)]
    LayoutMain --> PageContent
  ```
  _If SmoothScrollWrapper has a transform, FloatingDockHeader becomes relative to IT, not the viewport._

### D. Legacy Patterns (`space-x`)

- **Symptom**: Layouts might break on specific browsers or nested flex contexts.
- **Root Cause**: `space-x-*` adds `margin-left` to children.
  - In v4, this works, but checks for `hidden` attribute specificities might have changed.
  - Modern recommendation is `flex gap-*`.
- **Action**: Refactor key layouts (Navigation, Products) to use `gap`.

### E. Hydration Mismatches

- **Symptom**: Layout shift on mobile load.
- **Component**: `DraggableCard` -> `useIsMobile`.
- **Flow**:
  ```mermaid
  sequenceDiagram
    Server->>Client: Send HTML (Desktop Layout - isMobile=false)
    Client->>Hydrate: React Hydrates (matches HTML)
    Client->>Effect: useEffect checks window.innerWidth
    Client->>Render: Re-render with isMobile=true
    Client->>Paint: Layout Shift (Desktop layout -> Mobile layout)
  ```
- **Fix**: Use CSS media queries for layout switching where possible, OR accept the shift but verify no _markup_ mismatch warnings (current implementation is safe from warnings, but bad for CLS).

## 3. Prioritized Remediation Plan

| Priority | Issue                      | Recommended Fix                                                                                      | Impact                      |
| :------- | :------------------------- | :--------------------------------------------------------------------------------------------------- | :-------------------------- |
| **P0**   | **Missing `transform-3d`** | Add `@utility transform-3d` to `index.css`.                                                          | Fixes broken 3D cards.      |
| **P1**   | **Floating Dock Stacking** | Verify `Lenis` config; move `FloatingDockHeader` _outside_ `SmoothScrollLayout` wrapper if possible. | Fixes header occlusion.     |
| **P2**   | **Redundant Global Reset** | Remove `*` reset in `index.css` (`@layer base`) if covered by Preflight to reduce bundle.            | Performance / Cleanliness.  |
| **P3**   | **Legacy Spacing**         | Refactor `space-x` to `gap` in `FloatingDock` and product grids.                                     | Modernization / Robustness. |

## 4. Next Guardrails

1.  **Linting**: Add `eslint-plugin-tailwindcss` rule to warn on `space-*` usage (prefer `gap`).
2.  **Visual Regression**: Add Playwright test specifically for 3D card state.
3.  **Hydration**: Ensure all new conditional rendering based on viewport uses CSS (Tailwind variants `md:hidden`, etc.) instead of JS `useIsMobile` where possible.
