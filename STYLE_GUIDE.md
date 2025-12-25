# CSS Architecture & Style Guide

This project uses **Tailwind CSS v4** with **CSS Modules** (via PostCSS) and **Radix UI** primitives.

## Core Principles

1.  **CSS-First Configuration**: We use a single `client/src/index.css` file as the source of truth for all design tokens, imported via `@theme`.
2.  **Semantic Tokens**: Avoid hardcoded values (hex codes, pixel animations). Use semantic variables (e.g., `--color-primary`, `--z-modal`).
3.  **Component Encapsulation**:
    - Use `class-variance-authority` (CVA) for reusable atomic components (buttons, badges).
    - Use Tailwind utility classes for layout and one-off styling.
    - Avoid `@apply` unless creating a widely shared abstraction (like `.glass-card`).

## Design Tokens

All tokens are defined in `client/src/index.css` inside the `@theme` block.

### Colors

- `bg-primary` / `text-primary-foreground`: Main action color.
- `bg-card` / `text-card-foreground`: Card backgrounds.
- `bg-background` / `text-foreground`: Page defaults.

### Z-Index

Use standard z-index tokens found in `index.css`:

- `z-negative` (-1)
- `z-elevate` (1)
- `z-sticky` (100)
- `z-drawer` (200)
- `z-modal` (1000)
- `z-popover` (1100)
- `z-toast` (1200)

**Legacy Rule**: Do not use `z-[123]` or arbitrary numbers.

## Component Styling Patterns

### 1. Atomic Components (CVA)

For reusable UI elements, use `cva` to define variants.

```tsx
// components/ui/button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: "border border-input bg-background",
    },
  },
});
```

### 2. Feature Components

For one-off components, colocate styles using Tailwind utilities.

**✅ DO:**

```tsx
<div className="rounded-xl bg-card p-6 shadow-glow-sm">
  <h2 className="text-xl font-semibold">Title</h2>
</div>
```

**❌ DON'T:**

- `w-[235px]` (Magic numbers) -> Use `w-64` or layout constraints.
- `shadow-[0_4px_...]` (Arbitrary shadows) -> Use `shadow-glow-md`.
- Importing separate `.css` files for a single component (unless it's a massive, complex animation).

## Legacy Styles

We have consolidated loose CSS files into `client/src/index.css`.

- `safari-compatibility.css`: Browser fallbacks.
- `webgl-pointer-events.css`: 3D interaction layers.

## Linting & Maintenance

- Run `npm run verify:build` to correct package metadata.
- Use `biome check .` for general code quality.
