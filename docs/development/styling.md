# RUN-Remix Styling Guide & Architecture

**Status:** Stable (Tailwind v4 "Pure CSS" Engine)  
**Last Updated:** February 2026  
**Stack:** React 19, Tailwind CSS v4, Biome, Lucide React

This document is the **Single Source of Truth** for styling standards, CSS architecture, token scales, and linting rules in this repository.

---

## 1. Architecture Overview

We utilize Tailwind CSS v4's native CSS configuration engine, completely removing legacy JavaScript configuration files (`tailwind.config.js`).

### Single-Stylesheet Model

The client styles are organized in a modular single-stylesheet hierarchy starting from `client/app/index.css`:

```text
client/app/
├── index.css                            # Master entrypoint stylesheet
│   ├── @import "tailwindcss";           # v4 Framework core
│   ├── @import "./styles/theme.css";     # Base layers, CSS variables, @theme tokens
│   ├── @import "./styles/fonts.css";     # Custom brand @font-face declarations
│   ├── @import "./styles/overrides.css"; # Third-party component overrides (Leaflet, model-viewer)
│   ├── @import "./styles/animations.css";# Keyframes and animation utilities
│   ├── @import "./styles/manufacturing-utilities.css"; # Manufacturing domain styles
│   ├── @import "./styles/print.css";     # B2B spec sheet and document export print styles
│   ├── @import "./components/ui/map/map-styles.css";   # Interactive map styles
│   └── @import "./styles/sustainability-utilities.css";# Sustainability domain styles
│
├── lib/
│   ├── utils.ts                         # cn() helper (clsx + tailwind-merge)
│   └── design-tokens.ts                 # Type-safe token constants for JS contexts
│
└── utils/
    └── icon-resolver.ts                 # Dynamic Lucide icon resolution utility
```

### Pure CSS Theming with `@theme`

All custom tokens are registered using the Tailwind v4 `@theme` directive in `client/app/styles/theme.css`. The base CSS variables are bound to `:root` (light) and `.dark` (dark mode) scopes, with the `@custom-variant dark (&:where(.dark, .dark *));` selector.

---

## 2. Fluid Display Typography Scale

We utilize responsive, fluid typography driven by CSS `clamp()` functions. This eliminates breakpoint-jumping and guarantees seamless scaling between mobile viewports and ultra-wide displays.

### Display Scale Tokens

| Token / Utility | CSS Value / Formula | Line Height | Letter Spacing | Intended Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--text-display-2xl` / `text-display-2xl` | `clamp(4.5rem, 11vw, 8.5rem)` | `0.85` | `-0.04em` | Main hero titles, statement headlines |
| `--text-display-xl` / `text-display-xl` | `clamp(3.5rem, 9vw, 7rem)` | `0.88` | `-0.035em` | Major section headers, hero secondary |
| `--text-display-lg` / `text-display-lg` | `clamp(2.5rem, 6vw, 4.5rem)` | `0.92` | `-0.03em` | Feature card headings, modal titles |

### Extended Font Scale

- `--font-size-display-xs`: `clamp(1.5rem, 4vw, 2rem)`
- `--font-size-display-sm`: `clamp(2rem, 6vw, 3rem)`
- `--font-size-display-md`: `clamp(3rem, 8vw, 5rem)`
- `--font-sans`: `"Futura BT", "Helvetica Neue", sans-serif`
- `--font-heading`: `"Neue Stance", "Inter", system-ui, sans-serif`
- `--font-mono`: `"JetBrains Mono", monospace`

---

## 3. Master Design Tokens

### 🎨 Semantic Colors & Brand Systems

**Rule:** Never use raw palette colors (e.g. `gray-500`, `#000000`, `blue-600`). Always use semantic tokens.

#### Core Semantic Surface & Text

| Token | Class | Light Mode Value | Dark Mode Value | Context |
| :--- | :--- | :--- | :--- | :--- |
| `--color-background` | `bg-background` | `hsl(0 0% 100%)` | `hsl(240 10% 3.9%)` | Page background |
| `--color-foreground` | `text-foreground` | `hsl(240 10% 3.9%)` | `hsl(0 0% 98%)` | Primary body text |
| `--color-card` | `bg-card` | `hsl(0 0% 100%)` | `hsl(240 10% 3.9%)` | Card surfaces |
| `--color-muted` | `bg-muted` | `oklch(0.96 0.01 240)` | `oklch(0.25 0.02 240)` | Secondary background |
| `--color-muted-foreground` | `text-muted-foreground` | `oklch(0.45 0.02 240)` | `oklch(0.65 0.02 240)` | Secondary text |
| `--color-border` | `border-border` | `oklch(0.9 0.01 240)` | `oklch(0.25 0.02 240)` | Component borders |

#### Brand & Domain Colors

- **Brand Lime / Success:** `--color-brand-lime: #ccff00` / `--color-success: #ccff00`
- **Brand Accent:** `--color-brand-accent: #3300ff`
- **Manufacturing System:**
  - `--color-manufacturing-bg`: `#fdf2f0` (light) / `#0a0a0a` (dark)
  - `--color-manufacturing-card`: `#ffffff` (light) / `#121212` (dark)
  - `--color-manufacturing-accent`: `#d4a853`
  - `--color-manufacturing-head`: `#1a1a1a` (light) / `#ffffff` (dark)
  - `--color-manufacturing-body`: `#4a4a4a` (light) / `#e3dfd6` (dark)
- **Technology System:**
  - `--color-technology-primary`: `#0047ab`
  - `--color-technology-accent`: `#00d4ff`
  - `--color-technology-bg`: `#ffffff` (light) / `#0a0a0a` (dark)
  - `--color-technology-card`: `#f8fafc` (light) / `#121212` (dark)
- **Sustainability System:**
  - `--color-sustainability-primary`: `#1a4331` (light) / `#00c97b` (dark)
  - `--color-sustainability-bg`: `#f9faf9` (light) / `#0a0a0a` (dark)
  - `--color-sustainability-card`: `rgba(255, 255, 255, 0.6)` (light) / `rgba(255, 255, 255, 0.04)` (dark)

---

### 🔲 Corner Radii Scale

All radii inherit from master `--radius: 0.5rem` or explicit scales:

| Token | Class | Value | Usage |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | `rounded-xs` | `0.125rem` (2px) | Micro badges, tags |
| `--radius-sm` | `rounded-sm` | `0.25rem` (4px) | Small inputs, inner pills |
| `--radius-md` | `rounded-md` | `0.375rem` (6px) | Standard form controls |
| `--radius-lg` | `rounded-lg` | `0.5rem` (8px) | Default card container |
| `--radius-xl` | `rounded-xl` | `0.75rem` (12px) | Large feature cards |
| `--radius-2xl` | `rounded-2xl` | `1rem` (16px) | Modals, floating sheets |
| `--radius-3xl` | `rounded-3xl` | `1.5rem` (24px) | Hero containers |
| `--radius-full` / `--radius-pill` | `rounded-full` | `9999px` | Avatars, pill badges, dock buttons |
| `--radius-huge` | `rounded-huge` | `32px` | Stacking section cards |

---

### 🌫️ Elevation & Shadows Scale

The design system provides three distinct shadow scales:

#### 1. Core Elevation Scale
- `shadow-xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-sm`: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`
- `shadow-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`
- `shadow-2xl`: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`

#### 2. Luxury Shadow Scale
- `shadow-luxury-xs`: `0 1px 2px rgba(0, 0, 0, 0.05)`
- `shadow-luxury-sm`: `0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)`
- `shadow-luxury-md`: `0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)`
- `shadow-luxury-lg`: `0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)`
- `shadow-luxury-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

#### 3. Glow Shadows
- `shadow-glow-sm`: `0 0 10px 2px rgba(139, 92, 246, 0.15)`
- `shadow-glow-md`: `0 0 20px 4px rgba(139, 92, 246, 0.2)`
- `shadow-glow-lg`: `0 0 30px 8px rgba(139, 92, 246, 0.25)`
- `shadow-glow-primary`: `0 0 20px 4px hsl(var(--primary) / 0.3)`

---

## 4. Strict Styling Bans & CI Gates

To guarantee visual consistency and zero build flakiness, the following are **strictly banned**:

### 🚫 1. Strict Ban on Phantom Classes (`custom-misc-*`, `custom-space-*`)
- **What they are:** Corrupted placeholder class names generated by blind regex find-and-replace scripts (e.g. `custom-misc-347`, `data-custom-misc-462`, `text-custom-space-142`).
- **Impact:** They generate **0 bytes of CSS**, breaking interactive Radix components (e.g., switches, tabs) and collapsing font sizes.
- **Rule:** Never introduce `custom-misc-*` or `custom-space-*`. Radix state bindings must use standard Tailwind v4 data selectors (e.g., `data-[state=active]:bg-background`, `data-[state=checked]:bg-primary`).

### 🚫 2. Strict Ban on Arbitrary Bracket Classes
- **Forbidden:** `w-[350px]`, `h-[85vh]`, `z-[100]`, `bg-[#1a1a1a]`, `text-[13vw]`, `rounded-[18px]`
- **Allowed:** `w-sheet-sm`, `h-modal-lg`, `z-dropdown`, `bg-card`, `text-display-2xl`, `rounded-xl`
- **Rule:** If a specific dimension or design value is required across components, register a named token in `client/app/styles/theme.css` under `@theme`.

### 🚫 3. Strict Ban on `material-symbols-outlined` & Web Font Icons
- **Forbidden:** `<span className="material-symbols-outlined">settings</span>`, `@fontsource/material-symbols-outlined`
- **Why:** Web font icons suffer from layout shifts (CLS), FOUC, missing glyphs during network lag, and inconsistent baseline alignment.
- **Rule:** All icons must be rendered as clean inline SVG React components from `lucide-react`.

---

## 5. Lucide React Icon Standard & `resolveIcon`

All icons across the application are standardized on **Lucide React**.

### Static Icons (Direct Import)

When writing static JSX components, import the icon component directly:

```tsx
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";

export function FeatureBadge() {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <ShieldCheck className="h-4 w-4 text-brand-lime" />
      <span>Certified Sustainable</span>
    </div>
  );
}
```

### Dynamic & CMS Icons (`resolveIcon`)

For dynamic content coming from the CMS, database, or API (which store icon names as strings like `"science"`, `"precision_manufacturing"`, `"leaf"`, or `"zap"`), use the `resolveIcon` utility from `@/utils/icon-resolver`:

```tsx
import React from "react";
import { resolveIcon } from "@/utils/icon-resolver";

interface StatItemProps {
  iconName?: string | null;
  label: string;
  value: string;
}

export function StatCard({ iconName, label, value }: StatItemProps) {
  const IconComponent = resolveIcon(iconName);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconComponent className="h-5 w-5" />
      </div>
      <h4 className="text-2xl font-bold text-foreground">{value}</h4>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
```

#### How `resolveIcon` Works:
1. **Normalizes String Input:** Lowercases and trims input, mapping legacy names (e.g. `precision_manufacturing`, `biotech`, `arrow_forward`) to corresponding Lucide components (`Cog`, `FlaskConical`, `ArrowRight`).
2. **Safe Fallback:** If `iconName` is `null`, `undefined`, or unmapped, it gracefully returns `Globe` without throwing errors or breaking UI rendering.

---

## 6. Component Patterns

### Class Composition (`cn`)

Always use the `cn()` utility (`client/app/lib/utils.ts`) to merge classes and resolve Tailwind conflicts:

```tsx
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
```

### Variants (`cva`)

Use `class-variance-authority` for components with multiple variants and sizes:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

---

## 7. Quality Gates & Verification Commands

Before committing styling changes, run the following verification suite:

```bash
# 1. Typecheck and linting (Biome)
npm run check

# 2. Dependency and dead-code verification
npm run check:knip

# 3. Documentation structure and link validation
npm run verify:docs-structure
npm run check:docs

# 4. Playwright visual regression suite
npm run test:e2e:visual
```
