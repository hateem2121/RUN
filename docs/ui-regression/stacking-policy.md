# Stacking Context Policy

## Single Source of Truth

All Z-index values are defined in `client/src/index.css` within the `@theme` block.
**Legacy files like `z-index-stack.css` are explicitly forbidden.**

## Canonical Z-Index Scale (1000-Scale)

We adhere to a standard Bootstrap-like scale to ensure compatibility with third-party libraries and maintain a clear hierarchy.

| Token / Class      | Value | Usage                                       |
| :----------------- | :---- | :------------------------------------------ |
| `z-below`          | -1    | Behind content backgrounds                  |
| `z-base`           | 0     | Default content level                       |
| `z-dock`           | 50    | Specific for Floating Dock (below overlays) |
| `z-dropdown`       | 1000  | Dropdowns, Select menus                     |
| `z-sticky`         | 1020  | Sticky headers, filters                     |
| `z-fixed`          | 1030  | Fixed overlays, non-modal                   |
| `z-modal-backdrop` | 1040  | Backdrops for modals                        |
| `z-modal`          | 1050  | Dialogs, Modals, Lightboxes                 |
| `z-popover`        | 1060  | Popovers, Tooltips (low priority)           |
| `z-tooltip`        | 1070  | Critical Tooltips, Toasts                   |

## Usage Rules

1. **Utility Classes Only:** always use Tailwind utilities (e.g., `z-modal`) instead of arbitrary values (`z-[1050]`) or raw CSS variables.
2. **Context Isolation:** Modals should render in a Portal at the root level (`document.body`) to avoid being trapped in parent stacking contexts (transforms, filters).
3. **Sticky headers:** Use `z-sticky` (1020). Ensure dropdowns triggered from within sticky headers use `z-fixed` or higher if they need to escape, or rely on correct DOM ordering.

## Troubleshooting

- **Element hidden?** Check for parent stacking contexts (`opacity < 1`, `transform`, `filter`). Move the element to a Portal.
- **Dropdown clipped?** The parent container likely has `overflow: hidden` or `clip-path`. Use `z-index` will not fix clipping; use a Portal.
