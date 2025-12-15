# RUN-Remix Styling Guide & Architecture

## Overview

This project uses **Tailwind CSS v4** ("Pure CSS" mode) combined with standard CSS variables for its theming engine. It avoids `tailwind.config.js` in favor of native CSS `@theme` and `@custom-variant` directives.

## 1. Core Architecture

- **Entry Point:** `client/src/index.css`
- **Tailwind Version:** 4.0.0
- **Plugins:** `@tailwindcss/vite` (ESM build)

### Key Files

- `client/src/index.css`: The central registry. Imports Tailwind, plugins, and defines the global theme.
- `client/src/styles/style1-design-tokens.css`: Contains specialized design tokens and component classes.
- `client/src/styles/luxury-light-theme.css`: Definies the "Luxury" theme palette variables.

## 2. Recent Remediations (Forensic Audit)

Following the major upgrade to React 19 and Tailwind v4, specific remediations were applied to hardened the UI:

### A. Dark Mode (`color-scheme`)

We moved from a class-only dark mode to a system-aware hybrid approach.

- **Rule:** `:root { color-scheme: light dark; }` enables native browser elements (scrollbars, date pickers) to adapt to the OS theme.
- **Rule:** `.dark { color-scheme: dark; }` forces these elements into dark mode when the user explicitly toggles it via `next-themes`.
- **Implementation:**
  ```css
  /* client/src/index.css */
  @custom-variant dark (&:where(.dark, .dark *));
  ```

### B. Form Control Resets

Tailwind v4's "Modern Reset" is more aggressive than v3's Preflight and removes default borders from inputs.

- **Fix:** We manually restored Shadcn-like defaults in `@layer base`.
- **Usage:** Standard `<input>`, `<textarea>`, and `<select>` elements now have a default visual state without needing extra classes, but can still be overridden with utility classes.

## 3. Best Practices

### Using Colors (OKLCH)

We use the **OKLCH** color space for wider gamut support.

- **Token Format:** `--radius-md` (defined in `@theme`)
- **Color Format:** `oklch(var(--active))`
- **Do not use hex codes directly in components** if a semantic variable exists.

### Adding New Styles

1. **Utility First:** Always try to use Tailwind utilities.
2. **Tokens:** If you need a specific value, add it to the `@theme` block in `index.css` or `style1-design-tokens.css`.
3. **Legacy CSS:** Avoid adding new `legacy-*.css` files. Integrate new styles into the module system or utility layer.

### Troubleshooting Build Issues

- **"Missing closing }" errors:** Often caused by `@media` or `@theme` blocks that are unclosed in imported CSS files. The Tailwind v4 compiler checks these strictly.
- **Syntax Errors:** Ensure all imported CSS files use valid standard CSS syntax.

## 4. Migration Notes

- **`@apply`:** Still supported but discouraged for simple one-off styles.
- **`@layer base`:** Use this for element defaults (setup logic).
- **`theme()` function:** Works natively in CSS variables now (e.g., `font-family: var(--font-sans)`).
