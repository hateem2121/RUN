# RUN-Remix Styling Guide & Architecture

**Last Updated:** December 2025  
**Status:** Stable (10/10 Architecture Score)

## Overview

This project uses **Tailwind CSS v4** ("Pure CSS" mode) with comprehensive design tokens. All styling is consolidated into a single source of truth.

---

## 1. Core Architecture

| Metric            | Value                             |
| ----------------- | --------------------------------- |
| Entry Point       | `client/src/index.css`            |
| Tailwind Version  | 4.0.0                             |
| @theme tokens     | 116                               |
| @utility classes  | 56                                |
| Type-safe exports | `client/src/lib/design-tokens.ts` |

### File Structure

```
client/src/
├── index.css           # Single source of truth (931 lines)
├── lib/
│   ├── utils.ts        # cn() utility
│   └── design-tokens.ts # Type-safe token exports
└── components/ui/      # shadcn/ui components
```

**Note:** The `client/src/styles/` directory is deprecated. All styles are in `index.css`.

---

## 2. Token System

### Color Tokens (Semantic)

**⚠️ IMPORTANT:** Never use raw `gray-*` colors. Use semantic tokens:

| Raw Color         | Semantic Replacement    |
| ----------------- | ----------------------- |
| `text-gray-900`   | `text-foreground`       |
| `text-gray-600`   | `text-muted-foreground` |
| `bg-gray-100`     | `bg-muted`              |
| `bg-gray-50`      | `bg-background`         |
| `border-gray-200` | `border-border`         |

### Typography Tokens

```css
--font-size-display-xs: clamp(1.5rem, 4vw, 2rem);
--font-size-display-sm: clamp(2rem, 6vw, 3rem);
--font-size-display-md: clamp(3rem, 8vw, 5rem);
--font-size-display-lg: clamp(4rem, 10vw, 7rem);
--font-size-display-xl: clamp(5rem, 14vw, 10rem);
```

**Usage:** `className="text-display-lg"`

### Height/Width Tokens

```css
--height-tab: 48px;
--height-modal-sm: 500px;
--height-modal-md: 600px;
--height-modal-lg: 85vh;
--width-sheet-sm: 320px;
--width-sheet-md: 400px;
--width-sheet-lg: 540px;
```

**Usage:** `className="h-modal-lg w-sheet-md"`

### Z-Index Tokens

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

**Usage:** `className="z-modal"` instead of `z-[500]`

---

## 3. Component Patterns

### Class Composition

Always use the `cn()` utility:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", isActive && "active-classes", className)} />;
```

### Variants with cva

Use `cva` for components with multiple variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", primary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
});
```

---

## 4. Dark Mode

Dark mode is handled via semantic tokens that automatically adapt:

```tsx
<div className="bg-background text-foreground">
  {/* Automatically adapts to dark mode */}
</div>
```

The `dark:` prefix can be used for explicit dark mode overrides:

```tsx
<div className="bg-white dark:bg-black">Explicit dark mode styling</div>
```

---

## 5. Best Practices

### ✅ Do

- Use semantic color tokens (`text-foreground`, `bg-muted`)
- Use `cn()` for class composition
- Use `cva` for variant components
- Use token utilities (`z-modal`, `h-tab`, `text-display-lg`)
- Define new tokens in `@theme` block if needed

### ❌ Don't

- Use raw colors (`gray-500`, `#808080`)
- Use arbitrary values when tokens exist (`h-[500px]` → `h-modal-sm`)
- Use raw z-index numbers (`z-[999]` → `z-max`)
- Create new CSS files (use `index.css`)

---

## 6. Adding New Tokens

1. Add token to `@theme` block in `index.css`:

```css
@theme {
  --my-new-token: value;
}
```

2. Create utility class:

```css
@utility my-utility {
  property: var(--my-new-token);
}
```

3. Export in `design-tokens.ts` for type-safe access:

```typescript
export const myTokens = {
  newToken: "var(--my-new-token)",
} as const;
```

---

## 7. Biome Configuration

CSS linting is enabled with Tailwind v4 directive support:

```json
{
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  },
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

_Part of CSS Architecture 10/10 achievement - December 2025_
