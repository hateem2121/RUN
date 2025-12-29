# Contributing to RUN-Remix

## Frontend Architecture Standards (2025)

As of late 2025, we have migrated to React 19 and Tailwind CSS v4. To maintain code quality and prevent regressions, all frontend contributions must adhere to the following standards.

### 1. The "No-ForwardRef" Rule

**Status:** `React.forwardRef` is **DEPRECATED**.

In React 19, `ref` is passed as a prop automatically. Wrappers like `forwardRef` are no longer needed and introduce unnecessary boilerplate.

**❌ DO NOT USE:**

```tsx
const Example = React.forwardRef<HTMLDivElement, Props>((props, ref) => (
  <div ref={ref} {...props} />
));
Example.displayName = "Example";
```

**✅ DO USE:**

```tsx
interface ExampleProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

const Example = ({ ref, ...props }: ExampleProps) => (
  <div ref={ref} {...props} />
);
// Display name is still recommended for devtools
Example.displayName = "Example";
```

### 2. Z-Index Strategy

**Status:** Manual Z-index classes (e.g., `z-50`, `z-[100]`) are **FORBIDDEN**.

We use a semantic Z-index scale defined in our Tailwind v4 theme to ensure correct layering of overlays. Using arbitrary values leads to "z-index wars" and broken UIs.

**❌ DO NOT USE:**

- `z-50`
- `z-[9999]`
- `z-10`

**✅ DO USE:**
| `z-max` | `999` | Critical overlays locally scoped |
| `z-toast` | `700` | Toasts, critical notifications (Highest) |
| `z-popover` | `600` | Dropdowns, menus, hover cards |
| `z-modal` | `500` | Dialog content, Sheet content |
| `z-overlay` | `400` | Dimmed overlays behind modals |
| `z-fixed` | `300` | Fixed positioning elements |
| `z-sticky` | `200` | Sticky headers |
| `z-dropdown` | `100` | Dropdown content |

### 3. Tailwind v4 Syntax

**Status:** Use modern v4 syntax features.

- **Dynamic Utilities:** Use the `-(...)` syntax for arbitrary values instead of `-[...]` where possible for cleaner grouping, though `-[...]` is still supported.
- **Opacity Modifiers:** Use the `/` syntax for alpha modifiers (e.g., `bg-black/50` instead of `bg-opacity-50`).
- **Outline:** Use `outline-hidden` instead of `outline-none`.

**Example:**

```tsx
// ❌ Old
<div className="bg-black bg-opacity-50 outline-none z-50">

// ✅ New
<div className="bg-black/50 outline-hidden z-modal">
```
