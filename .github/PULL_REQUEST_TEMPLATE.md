## Summary & Context
<!-- Provide a clear description of what changes this PR introduces and why -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking enhancement to CMS or 3D configurator)
- [ ] 💥 Breaking change (fix/feature requiring schema migrations or interface updates)
- [ ] 📚 Documentation update (SOPs, README, ADRs)
- [ ] 🔧 Refactoring & Performance (zero behavioral regression)
- [ ] 🧪 Test improvements (E2E, integration, or unit tests)
- [ ] 🛡️ Security / Compliance hardening

## Related Issues
<!-- e.g. Fixes #123, Closes #456, Resolves #789 -->

---

## Contributor Checklist

### 1. B.L.A.S.T. Execution & Quality
- [ ] `npm run verify:tech-integrity` exits 0 (all critical checks passed)
- [ ] `npm run check:apply` executed (Biome formatting and linting clean)
- [ ] `npm run typecheck` exits 0 (strict TypeScript compilation, no `any`)
- [ ] `npm run test` passes (80%+ unit coverage maintained on services)
- [ ] `task_plan.md` and `findings.md` updated as applicable

### 2. Architecture & Security Invariants
- [ ] No direct DB calls from route controllers (all queries encapsulated in `server/services/`)
- [ ] No `try/catch` in Express 5 route handlers (rely on native async rejection handling)
- [ ] Service methods return `neverthrow` `ResultAsync` contracts (no raw throws)
- [ ] Session handling uses `DrizzleSessionStore` (Neon PostgreSQL)
- [ ] Input validation strictly enforced via `@run-remix/shared` Zod schemas
- [ ] No hardcoded secrets, tokens, or sensitive credentials

### 3. SSR & Frontend Precision
- [ ] No top-level `window` or `document` access during module evaluation (SSR safe)
- [ ] Leaf route components in `client/app/routes/` export default functions and export an `ErrorBoundary`
- [ ] Animations use `gsap` / `locomotive-scroll` (no `framer-motion` or `lenis`)
- [ ] 3D models use `LazyUnifiedModelViewer` (no raw `@react-three/fiber` or `drei`)
- [ ] Responsive design verified across viewports: Mobile (375px), Tablet (768px), Desktop (1440px), Wide (1920px)

### 4. Documentation & Community
- [ ] All new architectural patterns documented in `docs/` or accompanied by an ADR
- [ ] Code comments reflect RUN APPAREL's 100% B2B premium sustainable manufacturing identity

---

## Verification & Screenshots
<!-- Add terminal logs, reproduction commands, or UI screenshots for reviewer verification -->

