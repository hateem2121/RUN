# CSS Architecture & Quality Guide

**Status:** Stable
**Last Updated:** Late 2025 (Refined)
**Stack:** React 19, Tailwind v4, Biome v2+, Vite, Express 5

This document serves as the source of truth for styling, CSS architecture, and code quality standards for the `run-remix-b2b` project.

---

## 1. Tailwind v4 "CSS-First" Architecture

We leverage Tailwind v4's native CSS configuration to minimize JavaScript build configuration and keep our styles close to standard CSS.

### Configuration Strategy

Instead of `tailwind.config.js`, we use the new **CSS-first configuration**.

- **`@theme`**: Define all design tokens (colors, fonts, spacing, animations) directly in CSS variables within the `@theme` block.
- **`@import`**: Use natives CSS imports to organize styles.
- **CSS Variables**: Use native CSS variables for dynamic values and theme tokens.

### Global vs. Local Structure

- **Global Entry Point:** `client/src/index.css` is the **single source of truth** for global styles.
- **Theme Tokens:** All global tokens are defined in the `@theme` block in `client/src/index.css`.
- **Custom Utilities:** Project-specific utilities are defined using `@utility` in `client/src/index.css` or imported via CSS `@import_`.

**Folder Structure:**

```
client/src/
├── index.css                # Global entry point (Tailwind v4 Setup)
├── styles/                  # Organized CSS modules (imported by index.css)
│   ├── mobile-optimizations.css
│   ├── safari-compatibility.css
│   └── ...
└── components/              # React components (colocated styles strictly avoided unless necessary)
```

### Layering

We strictly adhere to the Tailwind v4 layering system to ensure predictability:

1.  **`@layer base`**: Resets and element defaults (e.g., `html`, `body`, headings).
2.  **`@layer components`**: Legacy styles and complex component classes that cannot be pure utilities.
    - _Note:_ Avoid valid CSS in this layer if possible; prefer React component composition.
3.  **`@layer utilities`**: Atomic utility classes. This is where Tailwind generates its standard classes.

**Example `client/src/index.css` Pattern:**

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.6 0.15 250);
  --font-sans: "Inter", sans-serif;
  --spacing-container: 1280px;

  /* Z-Index Semantic Scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-popover: 500;
  --z-tooltip: 600;
  --z-toast: 700;
}

@layer base {
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    @apply antialiased;
  }
}

/* Custom Utilities */
@utility glass-panel {
  background: color-mix(in oklch, var(--color-surface), transparent 20%);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
}
```

---

## 2. Component Styling & Maintainability

### Class Management

- **Conditional Classes:** strictly use `clsx` and `tailwind-merge` (typically combined as a `cn` helper).
- **Complex Components:** Use **`cva` (Class Variance Authority)** for components with multiple variants (e.g., solid/outline, sm/md/lg).
- **Template Literals:** Avoid raw template literals for conditional classes; they are prone to errors and hard to read.

### Radix UI Integration

Style Radix Primitives properties using `data-state` and standard Tailwind modifiers.
**Pattern:** `data-[state=value]:class-name`

```tsx
<Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden text-sm transition-all">
  {children}
</Accordion.Content>
```

### Abstraction Level

- **Avoid `@apply`**: Do not use `@apply` in CSS files to create "semantic" classes (e.g., `.btn-primary`).
- **Prefer React Composition**: Encapsulate repetitive styling patterns in React components.
- **Pure Utilities**: Use utility classes directly in JSX. Use CSS files only for:
  - Keyframe animations.
  - Complex selectors impossible with Tailwind.
  - 3rd-party library overrides.

**Standard Form Input Pattern:**

Use the `FormInput` component for consistent accessibility and styling:

```tsx
import { FormInput } from "@/components/ui/form-input";

<FormInput label="Email" error={errors.email?.message} {...register("email")} />;
```

**Sample `Button` Component (`cva`):**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils"; // standard clsx + tailwind-merge helper

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## 3. Automated Code Quality (Biome)

We use **Biome** for linting and formatting. It replaces Prettier and ESLint.

### Linting Rules

Ensure `biome.json` uses schema v2.3.10+ and has the following enabled:

- **`useSortedClasses`**: Enforces a consistent order for utility classes (moves to `nursery` in v2+).
- **`css` configuration**: Must enable `tailwindDirectives: true` to support `@theme`, `@utility`, etc.

### Formatting & Class Order

Biome largely follows the standard "logical" sorting order inspired by the official Tailwind plugin:

1.  **Layout** (display, position, etc.)
2.  **Box Model** (margin, padding, width, height)
3.  **Typography** (font, text, color)
4.  **Visuals** (background, border, shadow)
5.  **Interactivity** (cursor, focus, hover)

**Action:** Run `biome check --write .` (or `npm run check:apply`) to auto-fix sorting.

---

## 4. Performance & Modern Features

### Modern CSS Features

Leverage native CSS within Tailwind v4 to reduce JS overhead:

- **`color-mix()`**: Use for creating alpha-transparency or shade variations directly in CSS variables/theme.
  - _Example:_ `background: color-mix(in oklch, var(--primary), white 10%);`
- **`@property`**: Define types for CSS variables to enable animation of gradients and other typically non-animatable properties.
- **Container Queries**: Use `@container` and `@utility` to build components that adapt to their _container_ rather than the viewport.

### Optimization Strategy

- **Vite Split Chunks**: The `manualChunks` configuration in `vite.config.ts` ensures CSS is properly split and cached alongside its JS counterparts.
- **Zero-Runtime**: Tailwind is extracted at build time. We avoid CSS-in-JS libraries that add runtime overhead.
- **Bundle Analysis**: Use `rollup-plugin-visualizer` (integrated in `vite.config.ts`) to monitor CSS bundle size.
