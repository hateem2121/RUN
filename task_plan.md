# Task Plan: Tech Stack Major Version Upgrade (v4.1.0)

## 1. Phase 0: Baseline & Infrastructure
- [x] Update Node.js requirement to `v24.15.0` (.nvmrc)
- [x] Upgrade root tooling: Turbo `v2.9.6`, Playwright `v1.59.1`
- [x] Baseline verification: `npm install` and test pass check

## 2. Phase 1: Vite 8 & Ecosystem Migration
- [x] Upgrade React Router to `^7.14.2` (Monorepo-wide)
- [x] Upgrade Vite to `^8.0.10` and `@vitejs/plugin-react` to `^6.0.0`
- [x] Upgrade Tailwind CSS to `^4.2.4` (Oxide Engine)
- [x] Update critical Vite plugins: `inspect`, `sentry`, `visualizer`
- [x] Configure `tsconfig.json` for RR v7 type generation (`rootDirs`)

## 3. Phase 2: TypeScript 6.0 Migration
- [x] Upgrade TypeScript to `^6.0.3` (Monorepo-wide)
- [x] Update `tsconfig.base.json` for TS 6 deprecations (`ignoreDeprecations: "6.0"`)
- [x] Add explicit `types: ["node"]` to base configuration
- [x] Resolve inference regressions in Drizzle schemas via version harmonization

## 4. Phase 3: Final Verification & Docs
- [x] Update `gemini.md` Technical Stack invariants
- [x] Update `docs/core/tech-stack.md` and `docs/ONBOARDING.md`
- [x] Execute `npm run verify:tech-integrity`
- [x] Full build verification (`turbo run build`)

## 5. Deployment
- [ ] Push changes to `main`
- [ ] Verify CI stability
