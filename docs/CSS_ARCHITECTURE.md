# CSS Architecture Guide

## Z-Index Semantic Scale

Use semantic z-index tokens instead of arbitrary values. Never use `z-[123]` syntax.

| Token              | Value | Use Case                                      |
| ------------------ | ----- | --------------------------------------------- |
| `z-behind`         | -1    | Background decorations                        |
| `z-base`           | 0     | Default document flow                         |
| `z-default`        | 1     | General content layer                         |
| `z-elevated`       | 10    | Slightly raised cards                         |
| `z-dropdown`       | 100   | Dropdown menus                                |
| `z-sticky`         | 200   | Sticky headers                                |
| `z-dock`           | 250   | Floating dock/navigation                      |
| `z-modal-backdrop` | 300   | Modal backgrounds                             |
| `z-modal`          | 400   | Modal content                                 |
| `z-modal-nested`   | 450   | Nested dialogs                                |
| `z-popover`        | 500   | Popovers, color pickers                       |
| `z-tooltip`        | 600   | Tooltips                                      |
| `z-toast`          | 700   | Toast notifications                           |
| `z-cursor`         | 800   | Custom cursor                                 |
| `z-max`            | 9999  | Emergency escape hatch (document usage in PR) |

## Component Classes

### Admin Sortable Card

Use for dnd-kit sortable items in admin panels:

```tsx
className = "admin-sortable-card";
```

### Glass Card

Use for glassmorphism effect containers:

```tsx
className = "glass-card p-6";
// Or interactive version:
className = "glass-card-interactive p-6";
```

### Center Flex

Use instead of repeating `flex items-center justify-center`:

```tsx
className = "center-flex";
// Or for absolute positioning:
className = "center-absolute";
```

## Focus States

Always use `ring-ring` token for focus states, never `ring-blue-500`:

```tsx
// ✅ Correct
className = "focus-visible:ring-2 focus-visible:ring-ring";

// ❌ Incorrect
className = "focus-visible:ring-2 focus-visible:ring-blue-500";
```

## Color Tokens

Never use hardcoded hex colors in className. Use tokens:

| Instead of       | Use              |
| ---------------- | ---------------- |
| `bg-[#FAFAFA]`   | `bg-background`  |
| `bg-[#0A0A0A]`   | `bg-neutral-950` |
| `text-[#1a2d40]` | `text-primary`   |
| `border-[#...]`  | `border-border`  |

## Validation

Run before committing:

```bash
npm run lint:css-architecture
```

This checks for:

- Arbitrary z-index values (`z-[...]`)
- Hardcoded hex colors in classNames
