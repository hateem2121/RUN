# Project Audit & Fix Tasks

## Phase 3: Patch Set Generation (Build & Lint)

- [x] Gather TypeScript error list (`npx tsc -b`)
- [x] Create patch for script syntax errors
- [x] Create patch for `biome.json` (console policy)
- [x] Purge freemium extensions
- [x] Verify patches with `tsc` and `lint`

## Phase 4: Biome Check Fixes (Strict Compliance)

- [x] Run `npm run check` validation
- [x] Fix specific TS ignores (`@ts-expect-error`)
- [x] Fix redundant suppressions
- [x] Sort imports via `biome check --write`
- [x] Verify `npm run check` passes

## Phase 5: Runtime Fixes (CSP & Fonts)

- [x] Enable CSP middleware with nonces
- [x] Wire nonces to SSR template (Helmet & Hydration)
- [x] Restore missing font file
- [x] Verify runtime headers and console

## Phase 6: Persistent CSP (Static Scripts)

- [x] Patch `ssr-handler.ts` for static script injection
- [x] Rebuild server (`npm run build`)
- [x] Verify compilation

## Closeout

- [x] Generate Final Walkthrough
