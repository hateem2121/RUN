# CSS Linting & Code Quality Rules

This project enforces a strict CSS architecture based on **Tailwind CSS v4** and **Semantic Tokens**.

## 1. No Arbitrary Values

Arbitrary values (magic numbers) are discouraged. Always use tokens from the design system.

**❌ Forbidden:**

```tsx
<div className="w-[350px] min-h-[400px] text-[hsl(165,82%,51%)]" />
```

**✅ Allowed:**

```tsx
<div className="w-96 min-h-96 text-brand-teal" />
```

**Why?**

- **Theming**: Hardcoded colors break dark mode and theming.
- **Consistency**: Standard spacing ensures a harmonious layout.
- **Maintainability**: Updating a token updates the entire app.

## 2. No "Utility Soup"

Avoid strings of utility classes longer than 80-100 characters. Extract them using `cva` (Class Variance Authority).

**❌ Forbidden:**

```tsx
<div className="relative overflow-hidden rounded-xl border border-gray-800/60 bg-white/10 shadow-lg backdrop-blur-md shadow-glow-lg transition-all duration-300 dark:border-gray-900/70 dark:bg-white/5 hover:border-white/20 hover:shadow-xl">
```

**✅ Allowed:**

```tsx
// Using cva component
<GlassCard interactive />
// OR extracted to a variable
<div className={cardVariants({ variant: 'glass' })} />
```

## 3. Component Architecture

- **Global CSS**: Do not add new classes to `index.css`.
- **Overrides**: Use `cn()` (`tailwind-merge`) to allow prop overrides.
- **Focus**: Use the `focusRing` utility or standard `focus-visible` ring tokens.

## 4. Linting

Run `npx biome check` to enforce formatting and catch common errors.
