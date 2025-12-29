# RUN APPAREL Design System

**Last Updated:** December 2025  
**Architecture Score:** 10/10  
**Stack:** React 19 + Tailwind v4 + TypeScript

---

## Token Architecture

### Single Source of Truth

All design tokens are defined in `client/src/index.css` within the `@theme` block.

- **Total Tokens:** 116
- **Custom Utilities:** 56
- **Type-Safe Access:** `client/src/lib/design-tokens.ts`

---

## Color System

### Brand Colors

```css
--color-brand-purple: #5227ff;
--color-brand-purple-light: #ff9ffc;
--color-brand-accent: #3300ff;
```

### Semantic Surface Scale

```css
--color-surface-subtle: hsl(240 5% 96%); /* Light backgrounds */
--color-surface-muted: hsl(240 5% 90%); /* Muted surfaces */
--color-surface-emphasis: hsl(240 5% 75%); /* Emphasized areas */
```

### Semantic Text Scale

```css
--color-text-subtle: hsl(240 5% 55%); /* Secondary text */
--color-text-muted: hsl(240 5% 45%); /* Muted text */
--color-text-disabled: hsl(240 5% 38%); /* Disabled state */
```

### Status Colors

```css
--color-status-success: hsl(142 76% 36%);
--color-status-warning: hsl(45 93% 47%);
--color-status-info: hsl(217 91% 60%);
```

### shadcn/UI Token Mappings

Use these semantic tokens instead of raw colors:

- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-background` - Page background
- `bg-muted` - Muted surfaces
- `border-border` - Borders

**⚠️ IMPORTANT:** Never use raw `gray-*` colors. Always use semantic tokens.

---

## Typography

### Font Family

```css
--font-sans: "Neue Stance", system-ui, sans-serif;
--font-mono: "SF Mono", monospace;
```

### Display Typography (Responsive)

```css
--font-size-display-xs: clamp(1.5rem, 4vw, 2rem);
--font-size-display-sm: clamp(2rem, 6vw, 3rem);
--font-size-display-md: clamp(3rem, 8vw, 5rem);
--font-size-display-lg: clamp(4rem, 10vw, 7rem);
--font-size-display-xl: clamp(5rem, 14vw, 10rem);
```

**Usage:**

```tsx
<h1 className="text-display-lg">Hero Title</h1>
<h2 className="text-display-md">Section Title</h2>
```

---

## Spacing & Layout

### Height Tokens

```css
--height-tab: 48px;
--height-modal-sm: 500px;
--height-modal-md: 600px;
--height-modal-lg: 85vh;
--height-modal-full: 95vh;
--height-thumbnail: 80px;
--height-icon-sm: 1.2rem;
```

### Width Tokens

```css
--width-sheet-sm: 320px;
--width-sheet-md: 400px;
--width-sheet-lg: 540px;
--width-sidebar-collapsed: 80px;
--width-sidebar-expanded: 280px;
```

**Usage:**

```tsx
<div className="h-modal-lg w-sheet-md">Modal</div>
<button className="h-tab">Tab Button</button>
```

---

## Z-Index Scale

Managed via semantic tokens to prevent stacking conflicts:

```css
--z-behind: -1;
--z-default: 1;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-overlay: 400;
--z-modal: 500;
--z-popover: 600;
--z-toast: 700;
--z-max: 999;
```

**Usage:**

```tsx
<div className="z-modal">Modal</div>
<div className="z-toast">Toast Notification</div>
```

---

## Component Patterns

### Class Composition

Always use the `cn()` utility for class composition:

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn(
    "base-classes",
    variant === "primary" && "primary-classes",
    className,
  )}
/>;
```

### Variants with cva

Use `cva` for components with multiple variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("base-button-classes", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      ghost: "hover:bg-accent",
    },
    size: {
      sm: "h-9 px-3",
      md: "h-10 px-4",
      lg: "h-11 px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
```

---

## Radius & Shadows

### Radius Tokens

```css
--radius-button: 0.375rem;
--radius-card: var(--radius);
--radius-modal: 0.75rem;
--radius-popup: 0.5rem;
```

### Shadow Tokens

```css
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-popup: 0 10px 38px -10px rgba(0, 0, 0, 0.35);
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.1);
```

**Usage:**

```tsx
<div className="rounded-card shadow-card">Card</div>
<div className="rounded-modal shadow-popup">Modal</div>
```

---

## Dark Mode

Dark mode is enabled via the `dark:` prefix and semantic tokens:

```tsx
<div className="bg-background dark:bg-background text-foreground dark:text-foreground">
  Automatically adapts to dark mode
</div>
```

All semantic tokens (`foreground`, `muted-foreground`, `background`, etc.) automatically adapt to dark mode.

---

## Type-Safe Token Access

For JavaScript/TypeScript usage, import from `design-tokens.ts`:

```tsx
import { colors, zIndex, heights, widths } from "@/lib/design-tokens";

// Use in inline styles when needed
style={{ zIndex: zIndex.modal }}
style={{ height: heights.modalLg }}
```

---

## Breakpoints

Follow mobile-first responsive design:

```tsx
<div className="px-4 md:px-8 lg:px-16">Responsive padding</div>
```

| Breakpoint | Size   | Usage         |
| ---------- | ------ | ------------- |
| `sm`       | 640px  | Small tablets |
| `md`       | 768px  | Tablets       |
| `lg`       | 1024px | Laptops       |
| `xl`       | 1280px | Desktops      |
| `2xl`      | 1536px | Large screens |

---

## Accessibility

### Focus States

```tsx
<button className="focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none">
  Accessible Button
</button>
```

### Reduced Motion

```tsx
<div className="motion-safe:animate-fade-in motion-reduce:animate-none">
  Respects user preferences
</div>
```

---

## Quick Reference

### ✅ Do

- Use semantic tokens (`text-foreground`, `bg-muted`)
- Use `cn()` for class composition
- Use `cva` for variant components
- Use z-index tokens (`z-modal`, `z-toast`)
- Use height/width tokens (`h-modal-lg`, `w-sheet-md`)

### ❌ Don't

- Use raw colors (`gray-500`, `#808080`)
- Use inline styles for static values
- Use arbitrary values when a token exists
- Use raw z-index numbers (`z-[999]`)
