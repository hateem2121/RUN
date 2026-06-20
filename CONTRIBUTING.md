# Contributing to RUN Remix

Welcome. This is the short-form guide for contributors. The complete reference is at [`docs/core/CONTRIBUTING.md`](./docs/core/CONTRIBUTING.md).

---

## Workflow

This is a **private monorepo**. The default workflow is feature branching + PR via `/ship` (or `/land-and-deploy`). Direct commits to `main` are restricted and require explicit user authorization. External contributors open a PR from a fork.

Before every push:

```bash
npm run check:apply           # Biome format + lint (auto-fix)
npm run typecheck             # Must be 0 errors
npm run verify:tech-integrity # Must exit 0
npm run test                  # Tests must pass
```

---

## B.L.A.S.T. Protocol (Mandatory)

Every task — no exceptions:

1. **Before starting** — update `task_plan.md` with the plan
2. **After finishing** — update `findings.md` with what was done, discovered, and any follow-ups

---

## Hard Constraints

| Rule | Constraint |
|------|-----------|
| Port | **5002 only**. Never 3000, 8080, or any other port. |
| 3D | `@google/model-viewer` + `LazyUnifiedModelViewer` only. Never `@react-three/fiber`. |
| TypeScript | No `any`. Strict mode. Explicit return types on all functions. |
| React | No `forwardRef`. Raw ref props (React 19). Functional components only. |
| Express | No `try/catch` in route handlers. Express 5 handles async errors natively. |
| CSS | No arbitrary Tailwind values in JSX (`w-[342px]` is forbidden). |
| Logic | No business logic in routes. Routes call services; services contain logic. |
| Testing | Vitest, not Jest. 80%+ coverage on `server/services/`. |
| Linting | Biome, not ESLint or Prettier. Run `npm run check:apply`. |

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(products): add 3D configurator lazy loader
fix(auth): rotate session on Google OAuth callback
chore(deps): update Drizzle ORM to 0.45.1
```

---

## Pull Request Checklist

- [ ] `npm run verify:tech-integrity` exits 0
- [ ] `npm run typecheck` exits 0 (no TypeScript errors)
- [ ] `npm run check:apply` applied (Biome clean)
- [ ] `npm run test` passes
- [ ] `task_plan.md` updated before starting
- [ ] `findings.md` updated after finishing
- [ ] No new `any` types introduced
- [ ] No `@react-three/fiber` or `drei` imports
- [ ] No hardcoded ports other than 5002
- [ ] Tests added for any new service-layer logic

---

## Tech Stack Reference

Full stack details: [`CLAUDE.md`](./CLAUDE.md) | [`gemini.md`](./gemini.md) | [`docs/core/tech-stack.md`](./docs/core/tech-stack.md)

---

Thank you for helping build the future of sustainable sportswear technology.

**RUN APPAREL (PVT) LTD** — Sialkot, Pakistan | Subsidiary of Durus Industries (est. 1889)
