# Contributing to RUN Remix

**Welcome to the RUN Remix codebase!** This document outlines the standards and workflows required to maintain the high quality and performance of the RUN APPAREL CMS.

---

## 1. Tech Stack (Non-Negotiable)

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| **Frontend** | React | 19 | Functional components only. No `forwardRef`. |
| **Build** | Vite | 7 | Uses `@react-router/dev`. |
| **Styling** | Tailwind CSS | 4 | Use `@utility` layer. No arbitrary values. |
| **Backend** | Express | 5 | Async handlers supported natively. |
| **Language** | TypeScript | 5+ | **Strict Mode**. `noImplicitAny`. |
| **3D** | Model Viewer | - | **ONLY** `@google/model-viewer`. No Three.js/Fiber. |
| **Validation** | Zod | - | Unified schemas in `@run-remix/shared`. |

---

## 2. Coding Standards

### TypeScript

- **Zero `any` Policy:** Do not use `any`. Use `unknown` or proper interfaces.
- **Strict Null Checks:** Handle `null` and `undefined` explicitly.
- **Shared Types:** API responses and DTOs must be defined in `@run-remix/shared`.

### Components

- **Naming:** PascalCase for filenames and components (e.g., `ProductCard.tsx`).
- **Structure:** Domain-driven organization:

  ```text
  client/app/components/
  ├── ui/              # Generic (Button, Input) - shadcn-like
  ├── products/        # Domain specific
  ├── orders/          # Domain specific
  └── admin/           # Admin specific
  ```

- **Props:** Use interfaces, not types, for component props.

### Styling (Tailwind v4)

- **CSS Variables:** Use semantic variables defined in `index.css` / `theme.css`.
- **Classes:** Use `cn()` for class merging.
- **Forbidden:**
  - ❌ `<div className="w-[350px]">` (Arbitrary values)
  - ✅ `<div className="w-sidebar-expanded">` (tokens)

---

## 3. Workflow

### Git Conventions

- **Branches:** `type/description` (e.g., `feat/add-product-3d`, `fix/navbar-z-index`).
- **Commits:** Conventional Commits (`type(scope): message`).
  - `feat`: New feature
  - `fix`: Bug fix
  - `refactor`: Code change that neither fixes a bug nor adds a feature
  - `chore`: Build process or auxiliary tool changes

### Definition of Done

1. **Linting:** `biome check` passes.
2. **Types:** `tsc --noEmit` passes with 0 errors.
3. **Tests:** Relevant tests added/updated.
4. **Accessibility:** Interactive elements have ARIA labels & keyboard support.

---

## 4. 3D Content Guidelines (CRITICAL)

- **Engine:** We use `@google/model-viewer` for performance and stability.
- **Forbidden:** Do **NOT** introduce `@react-three/fiber` or `drei`.
- **Assets:** Models must be optimized GLB files under 5MB.

---

## 5. Directory Structure

- `client/`: React Remix Frontend
- `server/`: Express Backend
- `shared/`: Shared Zod schemas and TypeScript types

Thank you for helping us build the future of sustainable sportswear technology.
