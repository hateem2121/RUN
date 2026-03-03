---
name: tailwind-v4-oxide-engine
description: |
  Tailwind v4 high-performance styling. Triggers:
  - "tailwind v4", "oxide engine", "css @theme"
  - "@utility", "design tokens", "styling system"
---

# Tailwind CSS v4 (Oxide Engine) Standards

## Goal
Ensure all styling adheres to the Rust-based Oxide engine requirements, eliminating legacy config files and maximizing build speed.

## Instructions

### 1. Theme Configuration
- **DO NOT** create or edit `tailwind.config.js`.
- All design tokens must be defined using the CSS-native `@theme` directive in `client/app/index.css`.

### 2. Custom Utilities
Use the `@utility` directive for custom classes that aren't provided by Tailwind core.
```css
@utility glass-premium {
  @apply bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl;
}
```

### 3. Color Management
- Use semantic variables (e.g., `text-muted-foreground`) instead of raw hex codes.
- Utilize the `color-mix()` CSS function for dynamic adjustments.

## Constraints
- **NO** arbitrary values in JSX (e.g., `p-[23px]`). Define them as utilities or theme tokens.
- **NO** legacy Tailwind build-step plugins (PostCSS is deprecated).
