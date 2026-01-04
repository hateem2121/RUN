# CSS Architecture & Quality Guide

**Status:** Stable (10/10 Architecture Score)  
**Last Updated:** December 2025  
**Stack:** React 19, Tailwind v4, Biome v2+, Vite, Express 5

This document serves as the source of truth for styling, CSS architecture, and code quality standards.

---

## 1. Architecture Overview

### Final Metrics

| Metric             | Value | Status           |
| ------------------ | ----- | ---------------- |
| @theme tokens      | 116   | ✅ Comprehensive |
| @utility classes   | 56    | ✅ Extensive     |
| CSS file lines     | 931   | Single source    |
| Raw gray-\* colors | 0     | ✅ All migrated  |
| cva variants       | 49    | ✅ Strong system |
| cn() adoption      | 383   | ✅ 100% coverage |

---

## 2. Tailwind v4 "CSS-First" Architecture

We leverage Tailwind v4's native CSS configuration with CSS-first design tokens.

### Configuration Strategy

- **`@theme`**: All design tokens defined in CSS variables
- **`@utility`**: Custom utility classes
- **`@layer`**: Organized base, components, utilities layers

### File Structure

```
client/src/
├── index.css                    # 931 lines - SINGLE SOURCE OF TRUTH
│   ├── @import "tailwindcss"    # Framework import
│   ├── @theme { ... }           # 116 design tokens
│   ├── @layer base { }          # Root variables + resets
│   ├── @layer components { }    # Complex component styles
│   ├── @layer utilities { }     # Performance helpers
│   └── @utility declarations    # 56 custom utilities
│
├── lib/
│   ├── utils.ts                 # cn() = twMerge(clsx(...))
│   └── design-tokens.ts         # Type-safe token exports
│
└── components/ui/               # shadcn/ui + custom components
```

**Note**: The `client/src/styles/` directory is deprecated. All styles are consolidated into `index.css`.

---

## 3. Token Categories

### Colors (Semantic Only)

```css
@theme {
  /* Brand */
  --color-brand-purple: #5227ff;
  --color-brand-accent: #3300ff;

  /* Surface Scale */
  --color-surface-subtle: hsl(240 5% 96%);
  --color-surface-muted: hsl(240 5% 90%);

  /* Text Scale */
  --color-text-subtle: hsl(240 5% 55%);
  --color-text-muted: hsl(240 5% 45%);

  /* Status */
  --color-status-success: hsl(142 76% 36%);
  --color-status-warning: hsl(45 93% 47%);
}
```

**⚠️ IMPORTANT:** Never use raw `gray-*` colors. Use semantic tokens:

- `text-foreground` / `text-muted-foreground`
- `bg-background` / `bg-muted`
- `border-border`

### Typography (Responsive)

```css
@theme {
  --font-size-display-xs: clamp(1.5rem, 4vw, 2rem);
  --font-size-display-sm: clamp(2rem, 6vw, 3rem);
  --font-size-display-md: clamp(3rem, 8vw, 5rem);
  --font-size-display-lg: clamp(4rem, 10vw, 7rem);
  --font-size-display-xl: clamp(5rem, 14vw, 10rem);
}
```

### Heights & Widths

```css
@theme {
  --height-tab: 48px;
  --height-modal-sm: 500px;
  --height-modal-md: 600px;
  --height-modal-lg: 85vh;
  --width-sheet-sm: 320px;
  --width-sheet-md: 400px;
  --width-sheet-lg: 540px;
}
```

### Z-Index Scale

```css
@theme {
  --z-behind: -1;
  --z-default: 1;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 500;
  --z-popover: 600;
  --z-toast: 700;
  --z-max: 999;
}
```

---

## 4. Component Styling Patterns

### Class Composition with cn()

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", isActive && "active-classes", className)} />;
```

### Variants with cva

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", primary: "...", ghost: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
});

type ButtonProps = VariantProps<typeof buttonVariants>;
```

### Radix UI Integration

```tsx
<DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out">
```

---

## 5. Custom Utilities

### Using @utility

```css
@utility z-modal {
  z-index: var(--z-modal);
}

@utility h-modal-lg {
  height: var(--height-modal-lg);
}

@utility text-display-lg {
  font-size: var(--font-size-display-lg);
  line-height: 1.1;
  font-weight: 700;
}
```

---

## 6. Layering Strategy

```css
@layer base {
  /* Element defaults, resets, CSS variables */
  :root {
    /* ... */
  }
  body {
    /* ... */
  }
}

@layer components {
  /* Complex component styles that can't be pure utilities */
  .leaflet-popup-content {
    /* third-party overrides */
  }
}

@layer utilities {
  /* Performance helpers, one-off utilities */
  .gpu-accelerated {
    transform: translateZ(0);
  }
}
```

---

## 7. Type-Safe Token Access

```tsx
import { colors, zIndex, heights } from "@/lib/design-tokens";

// For runtime JavaScript usage
style={{ zIndex: zIndex.modal }}
style={{ height: heights.modalLg }}

// getCssVar helper
import { getCssVar } from "@/lib/design-tokens";
const modalZ = getCssVar("z-modal"); // "var(--z-modal)"
```

---

## 8. Biome Integration

### CSS Linting

```json
{
  "css": {
    "formatter": { "enabled": true },
    "linter": {
      "enabled": true
    },
    "parser": {
      "tailwindDirectives": true
    }
  }
}
```

### Class Sorting

```json
{
  "linter": {
    "rules": {
      "nursery": {
        "useSortedClasses": "error"
      }
    }
  }
}
```

---

## 9. PR Checklist

When reviewing CSS changes:

- [ ] No new hardcoded `gray-*` colors (use semantic tokens)
- [ ] No arbitrary values when a token exists
- [ ] Complex variants use `cva`
- [ ] Class composition uses `cn()`
- [ ] Dark mode tested with `dark:` variants
- [ ] Z-index uses tokens (`z-modal`, not `z-[500]`)
- [ ] Biome class sorting passes

---

## 10. Quick Reference

### ✅ Correct Usage

```tsx
// Colors
<p className="text-muted-foreground">Secondary text</p>
<div className="bg-muted">Muted background</div>

// Layout
<div className="h-modal-lg w-sheet-md">Modal</div>
<button className="h-tab">Tab</button>

// Z-Index
<div className="z-modal">Modal layer</div>
<div className="z-toast">Toast layer</div>

// Typography
<h1 className="text-display-lg">Hero</h1>
```

### ❌ Avoid

```tsx
// Raw colors
<p className="text-gray-500">Bad</p>

// Arbitrary values
<div className="h-[500px]">Use h-modal-sm</div>
<div className="z-[999]">Use z-max</div>

// Direct inline when not needed
<div style={{ zIndex: 999 }}>Use z-max class</div>
```

---

_Document maintained as part of CSS Architecture 10/10 achievement._
