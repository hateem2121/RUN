# System Context V4.0 (Late 2025)

**Version:** 4.0.0 (Tailwind v4 "Oxide" Architecture)
**Date:** December 23, 2025
**Status:** Live / Production Ready

## 1. System Overview

The system is a high-performance, SEO-optimized web application built on **React 19**, **Vite**, and **Express 5**. It leverages **Tailwind CSS v4** ("Oxide" engine) for a zero-runtime, CSS-first styling architecture.

## 2. Styling Strategy (CSS-First)

The project has migrated away from JavaScript-based configuration (`tailwind.config.js`) to a native CSS configuration approach.

### Core Principles

1.  **CSS Variable Driven**: All theme values (colors, spacing, z-index) are defined as native CSS variables in `index.css` under the `@theme` directive.
2.  **No Magic Numbers**: Arbitrary values (e.g., `z-[60]`, `top-[13px]`) are strictly **BANNED**. Use semantic utilities.
3.  **Performance**: The Oxide engine compiles styles roughly 10x faster than v3.

### Configuration (`index.css`)

```css
@import "tailwindcss";

@theme {
  /* Semantic Z-Index Scale */
  --z-index-toast: 200;
  --z-index-popover: 150;
  --z-index-modal: 100;
  --z-index-dock: 50;
  --z-index-dropdown: 50;

  /* Brand Colors (OKLCH) */
  --color-luxury-surface: oklch(0.99 0.005 100);
}
```

## 3. Z-Index Hierarchy (Strict Scale)

To prevent creating new stacking contexts and collisions, developers must adhere to this strict hierarchy.

| Tier        | Value           | usage                                                      |
| :---------- | :-------------- | :--------------------------------------------------------- |
| **Toast**   | `z-200`         | Critical alerts, toast notifications (Topmost)             |
| **Popover** | `z-150`         | Tooltips, Staggered Menus, Select dropdowns                |
| **Modal**   | `z-100`         | Dialogs, Lightbox, Full-screen overlays                    |
| **Dock**    | `z-50`          | Floating navigation bars, Sticky headers, Dropdown content |
| **Base**    | `z-0` to `z-10` | Standard page content, cards, decorative elements          |

**Gotchas & Warnings:**

> [!WARNING] > **Do NOT use `z-[magic-number]`**.
>
> - ❌ Bad: `z-[60]` (Causes race conditions between Docks and Modals)
> - ✅ Good: `z-[var(--z-index-dock)]` or standard `z-50`

## 4. Migration Notes (v3 -> v4)

- **Shadows**: We no longer use duplicate design token files. Use the `.shadow-sm-xs` utility or `shadow-[var(--style1-shadow-sm-xs)]`.
- **Animations**: CSS Filters must use valid syntax.
  - ❌ `filter: drop-shadow-sm(...)`
  - ✅ `filter: drop-shadow(...)`
- **Flexbox**: The v4 engine is stricter about `flex-basis`. Avoid redundancy like `basis-full grow-0`; `basis-full` implies `width: 100%`.

## 5. Technology Stack

- **Frontend**: React 19 (Compiler Active), Tailwind CSS v4, Framer Motion
- **Backend**: Express 5, Drizzle ORM
- **Build**: Vite 6 (ESBuild)
