# Developer Workflow Guide

Welcome to the RUN Apparel B2B platform! This guide outlines the standard operating procedures for developing, testing, and contributing to the repository.

---

## 1. Local Development Lifecycle

### Getting Started

1. **Node.js**: Ensure you are using **Node v24**.
2. **Bootstrap**: Run `./scripts/bootstrap.sh` to install dependencies, setup env, and verify configuration.
3. **Boot**: Run `npm run dev` to start the Turbo dev pipeline (React 19 + Express 5).

### Branching Strategy

- **`main`**: Production-ready code only.
- **`develop`**: Integration branch for the next release.
- **`feature/[name]`**: New features (branched from `develop`).
- **`fix/[name]`**: Bug fixes (branched from `develop` or `main`).

---

## 2. Commit Standards & Security

### Pre-commit Hooks

We use **Husky** to enforce quality and security before code leaves your machine:

1. **Typecheck**: `tsc -b` must pass root-level.
2. **Linting**: `biome check` enforces styling and code quality.
3. **Secret Scanning**: `scripts/security/check-secrets.sh` scans staged files for API keys, private keys, and tokens.

> [!CAUTION]
> If the secret scanner flags a file, the commit will be blocked. Ensure you are not committing real secrets. Use `.env` (ignored) for local secrets.

### Pre-push Hooks

Before pushing to the remote repository, the system runs:

- `npm run verify:tech-integrity`: A full health check including builds and bundle size verification.

---

## 3. Testing Requirements

### Unit & Integration Testing

- **Vitest**: Used for logical units and server-side integration.
- Run `npm run test` or `npm run test:integration`.

### E2E Testing

- **Playwright**: Used for critical user flows (Login, Product Selection, Inquiry).
- Run `npm run test:e2e`.

---

## 4. Documentation Policy (Docs-as-Code)

### Maintaining Accuracy

- **ADRs**: When making significant architectural decisions, create a new ADR in `docs/adr/`.
- **API Docs**: Always update `docs/api/endpoints.md` when adding or modifying endpoints.
- **Overview**: The `docs/overview.md` is the Single Source of Truth for system versions.

### Doc Freshness

The `verify:tech-integrity` script will issue a warning if `docs/overview.md` hasn't been reviewed in over 90 days. Please keep it fresh!

---

## 5. 3D Asset Pipeline

When adding 3D models (GLB):

1. Optimize with `gltf-transform` or `gltf-pipeline`.
2. Target < 5MB per model.
3. See `docs/development/3d-pipeline.md` for the full ingestion workflow.

---

## 6. CSS & Design System

- **Tailwind v4**: Use `@theme` tokens exclusively.
- **Semantic Colors**: Avoid arbitrary values (e.g., `text-[#123456]`). Use `text-primary`, `bg-muted`, etc.
- **Composition**: Use the `cn()` utility for all className merging.

---

**Happy Coding!**  
_Last updated: February 2026_
