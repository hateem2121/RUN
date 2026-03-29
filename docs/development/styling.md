# RUN-Remix Styling Guide & Architecture

**Status:** Stable (Tailwind v4 "Pure CSS" Engine)  
**Last Updated:** January 2026  
**Stack:** React 19, Tailwind CSS v4, Biome

This document is the **Single Source of Truth** for styling standards, CSS architecture, and linting rules in this repository.

---

## 1. Architecture Overview

We utilize Tailwind v4's native CSS configuration engine, moving away from JavaScript-based configs.

### Key Metrics

- **Architecture Score:** 10/10
- **@theme tokens:** 116+
- **@utility classes:** 56+
- **Arbitrary Values:** 0 (Strictly enforced)
- **Class Composition:** 100% `cn()` adoption

### File Structure

```text
client/app/
├── index.css                    # 700+ lines. THE SINGLE SOURCE OF TRUTH.
│   ├── @import "tailwindcss"    # v4 Framework
│   ├── @theme { ... }           # Design System Tokens
│   ├── @layer base { }          # Resets & Variables
│   ├── @layer components { ... }# Complex styles
│   └── @utility declarations    # Custom utilities
│
├── lib/
│   ├── utils.ts                 # cn() helper
│   └── design-tokens.ts         # Type-safe exports for JS usage
│
└── components/ui/               # shadcn/ui library
```

> **Note:** The `client/app/styles/` directory contains theme and override styles imported by `index.css`.

---

## 2. Token System

### 🎨 Colors (Semantic Only)

**Rule:** Never use raw colors (e.g., `gray-500`, `#000`). Always use semantic tokens.

| Raw Color (Forbidden) | Semantic Token (Required) | Usage Context         |
| :-------------------- | :------------------------ | :-------------------- |
| `text-gray-900`       | `text-foreground`         | Body text             |
| `text-gray-500`       | `text-muted-foreground`   | Secondary text        |
| `bg-gray-50`          | `bg-background`           | Page background       |
| `bg-gray-100`         | `bg-muted`                | Secondary backgrounds |
| `border-gray-200`     | `border-border`           | Borders               |
| `blue-600`            | `text-brand-primary`      | Brand actions         |

### 📐 Typography (Responsive)

We use fluid typography with `clamp()` defined in `index.css`.

- `text-display-xl`: Giant hero text
- `text-display-lg`: Section headers
- `text-body-base`: Standard readable text

### 📦 Layout & Dimensions

- `h-modal-lg`: Standard modal height (85vh)
- `w-sheet-md`: Standard drawer width (400px)
- `h-tab`: Standard tap target (48px)

### 🥞 Z-Index Scale

**Rule:** No magic numbers (`z-[50]`). Use the scale.

```css
--z-behind: -1;
--z-default: 1;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 500;
--z-popover: 600;
--z-toast: 700;
--z-max: 999;
```

**Usage:** `className="z-modal"`

---

## 3. Component Patterns

### Class Composition (`cn`)

Always use the `cn()` utility to merge classes and handle overrides.

```tsx
import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  // ✅ Allows className prop to override default styles safely
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}
```

### Variants (`cva`)

Use `class-variance-authority` for components with multiple visual states.

```tsx
import { cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
```

---

## 4. Linting & Quality Rules

Run the linter: `npm run lint` (Biome)

### ⛔ Rule 1: No Arbitrary Values

**Forbidden:** `w-[350px]`, `z-[100]`, `bg-[#f0f0f0]`
**Allowed:** `w-sheet-sm`, `z-dropdown`, `bg-muted`

**Why?** Theming, dark mode support, and maintainability.

### ⛔ Rule 2: No "Utility Soup"

Avoid excessively long class strings. If a string exceeds ~80-100 chars, consider:

1. Extracting to a `cva` variant.
2. Using a `@layer component` class (sparingly).

**Example of Soup (Bad):**
`<div className="relative overflow-hidden rounded-xl border border-gray-800/60 bg-white/10 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105..." />`

### ⛔ Rule 3: Tailwind v4 Syntax

- Use `/` for opacity: `bg-black/50` (not `bg-opacity-50`)
- Use `outline-hidden` (not `outline-none`)
- Use `shadow-sm` (not `shadow-[...]`)

---

## 5. Adding New Tokens

1. **Define in CSS:**
   Edit `client/app/index.css` inside the `@theme` block.

   ```css
   @theme {
     --color-brand-new: oklch(0.8 0.1 200);
   }
   ```

2. **Create Utility (Optional):**

   ```css
   @utility text-brand-new {
     color: var(--color-brand-new);
   }
   ```

3. **Export for JS (Optional):**
   Update `client/app/lib/design-tokens.ts` if you need to access it in specific JS logic (rare).

---

## 6. Dark Mode

Dark mode is **automatic** via semantic tokens.

- `bg-background` resolves to `white` in light mode and `slate-950` in dark mode.
- You generally **do not** need to write `dark:bg-slate-950`. Trust the tokens.

Manual overrides (use sparingly):

```tsx
<div className="bg-white dark:bg-black">...</div>
```
