# Floating Dock Navbar

A premium, glassmorphism-inspired navigation component designed for RUN APPAREL's 2026 platform. It features a responsive layout that transitions between a desktop "floating dock" and a mobile "staggered menu".

## Features

- **Tailwind V4 Powered**: Uses modern CSS-first configuration and Houdini properties.
- **Glassmorphism Aesthetic**: Premium backdrop blur and gradient overlays.
- **Responsive Stacking**: Automatically switches between desktop dock and mobile hamburger menu.
- **Hydration Safe**: Includes a skeleton loader to prevent FOUC during SSR-to-client transitions.
- **Zero-Overlap Layout**: Fixed positioning with `pointer-events` optimization to allow interacting with content behind the header.

## Components

- `FloatingDockHeader.tsx`: The main entry point that manages mounting and global positioning.
- `ResponsiveNavigation.tsx`: Handles the logic for switching between mobile and desktop views.
- `FloatingDock.tsx`: The interactive desktop dock component with motion-transformed icons.
- `FloatingDockSkeleton.tsx`: Placeholder rendered during initial hydration.

## Troubleshooting

### Z-Index Conflicts

The navbar uses `z-(--z-index-dock)` (default 1100). Ensure other full-screen overlays use a higher index (e.g., `z-modal` at 1300) to appear above it.

### Hydration Flash

If you see a layout jump on load, ensure the `FloatingDockSkeleton` matches the final height and positioning of the `FloatingDock`.

## Migration Notes (V3 to V4)

- **Syntax**: Always use `bg-(--var)` instead of `bg-[--var]`.
- **Opacity**: Use `border-(--color-border)/opacity` for reactive theme-aware borders.
- **Positioning**: Use `fixed` at the root header to avoid relative stacking context encapsulation issues.

---
*Created by Antigravity AI - Feb 2026*
