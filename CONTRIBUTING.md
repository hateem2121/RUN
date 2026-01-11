# Contributing to RUN Apparel B2B

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to the RUN-Remix monorepo.

## 🛠 Tech Stack Overview

- **Core**: React 19, Express 5, Node 24
- **Build**: Vite 7, TurboRepo
- **Style**: Tailwind CSS v4
- **Language**: TypeScript 5+ (Strict)
- **Test**: Vitest (Unit), Playwright (E2E)

## 🚀 Quick Start

1.  **Prerequisites**: Node.js 24+, npm 10+
2.  **Clone**: `git clone <repo>`
3.  **Install**: `npm install`
4.  **Setup Env**: `cp .env.example .env`
5.  **Dev Server**: `npm run dev`

## 🏗 Monorepo Structure

We use **NPM Workspaces** managed by TurboRepo.

- `client/`: Frontend application (`@run-remix/client`)
- `server/`: Backend API (`@run-remix/server`)
- `shared/`: Shared schemas/types (`@run-remix/shared`)
- `scripts/`: Dev & CI automation

⚠️ **Rule**: Never edit `shared` without checking dependents (`client` and `server`).

## 🧪 Testing Policy

All PRs must pass the "Tech Integrity" check:

\`\`\`bash
npm run verify:tech-integrity
\`\`\`

This single command runs:
1.  **Typecheck**: `tsc -b`
2.  **Lint**: `biome check`
3.  **Audit**: `audit-ci`
4.  **Build**: `vite build`

## 📝 Coding Standards

### React 19

#### The "No-ForwardRef" Rule

`React.forwardRef` is **DEPRECATED**. In React 19, `ref` is passed as a prop automatically.

```tsx
// ❌ DO NOT USE:
const Example = React.forwardRef<HTMLDivElement, Props>((props, ref) => (
  <div ref={ref} {...props} />
));

// ✅ DO USE:
interface ExampleProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}
const Example = ({ ref, ...props }: ExampleProps) => (
  <div ref={ref} {...props} />
);
```

- **Actions**: Use `useActionState` for forms.
- **Server Components**: Keep client components at leaves (`"use client"`).

### Styling (Tailwind v4)

- **No Raw Colors**: Use semantic tokens (e.g., `text-muted-foreground`, not `text-gray-500`).
- **Composition**: Use `cn()` helper for merging classes.

#### Z-Index Strategy

Manual Z-index classes (e.g., `z-50`, `z-[100]`) are **FORBIDDEN**. Use semantic scale:

| Token | Value | Usage |
|-------|-------|-------|
| `z-toast` | 700 | Toasts, notifications |
| `z-popover` | 600 | Dropdowns, menus |
| `z-modal` | 500 | Dialogs, sheets |
| `z-overlay` | 400 | Dimmed overlays |
| `z-fixed` | 300 | Fixed elements |
| `z-sticky` | 200 | Sticky headers |

#### Tailwind v4 Syntax

- Use `/` syntax for opacity: `bg-black/50` not `bg-opacity-50`
- Use `outline-hidden` not `outline-none`

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add 3d viewer`
- `fix: resolve hydration error`
- `docs: update api reference`

## 📦 Pull Request Process

1.  Update the `README.md` with details of changes if appropriate.
2.  Update the `CHANGELOG.md` with a note describing your changes.
3.  The PR will trigger a `verify:tech-integrity` check.
4.  The checks **must pass** before merging.
