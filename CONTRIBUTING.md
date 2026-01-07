# Contributing to RUN Apparel B2B

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to the RUN-Remix monorepo.

## 🛠 Tech Stack Overview

- **Core**: React 19, Express 5, Node 22 (LTS)
- **Build**: Vite 6, TurboRepo
- **Style**: Tailwind CSS v4
- **Language**: TypeScript 5+ (Strict)
- **Test**: Vitest (Unit), Playwright (E2E)

## 🚀 Quick Start

1.  **Prerequisites**: Node.js 22+, npm 10+
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
- **No ForwardRef**: Use ref as a prop.
- **Actions**: Use `useActionState` for forms.
- **Server Components**: Keep client components at leaves (`"use client"`).

### Styling (Tailwind v4)
- **No Raw Colors**: Use semantic tokens (e.g., `text-muted-foreground`, not `text-gray-500`).
- **Composition**: Use `cn()` helper for merging classes.

### Commits
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add 3d viewer`
- `fix: resolve hydration error`
- `docs: update api reference`

## 📦 Pull Request Process

1.  Update the `README.md` or `SYSTEM_CONTEXT.md` with details of changes if appropriate.
2.  Update the `CHANGELOG.md` with a note describing your changes.
3.  The PR will trigger a `verify:tech-integrity` check.
4.  The checks **must pass** before merging.
