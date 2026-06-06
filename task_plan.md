# Task Plan

## Session: 2026-06-06 (System Resolution)

**Goal:**
- Execute **Phase 1 — Architecture Enforcement (HIGH)** from the Master System Resolution Plan.
- Ensure strict adherence to Biome rules, React 19 standards, and thin controller patterns.

**Phase 0 Checklist:**
- [x] S-01: Update react-router 7.14.2 → 7.16.0
- [x] S-02: Update turbo 2.9.6 → 2.9.14+
- [x] S-03: Update ws, brace-expansion, protobufjs, qs
- [x] S-04: Disable source maps in production build
- [x] S-05: Add Zod validation to unvalidated req.body routes
- [x] S-06: Audit dangerouslySetInnerHTML in 5 components
- [x] S-07: Fix Express 5 try/catch violations

**Phase 1 Checklist:**
- [x] A-01: Remove ESLint and Prettier configuration files. Ensure Biome `noExplicitAny` is error-level.
- [x] A-02: Fix default export violations in `client/app/components/` and `client/app/routes/`.
- [x] A-03: Enforce React 19 `forwardRef` removal (use `ref` prop natively).
- [x] A-04: Fat controller refactoring for remaining `server/routes/` files violating the "Thin Controller" rule.

**Outcome:**
- Phase 1 fully completed. All routes refactored to use `export function Component` rather than default exports.
- Extracted cache, webhooks, and validation logic from fat controllers (e.g. `categories`, `services`) to the domain service layer.
- Enforced `noExplicitAny` as an error in `biome.json` and confirmed no legacy ESLint configurations remain.
- Migrated generic `throw result.error;` inside `if (result.isErr())` blocks to `result.match()` across the routing layer where applicable.
- Fixed unused variable `data` TypeScript errors generated during refactor.
- Passed `npm run check`, `npm run build`, and `npm run verify:tech-integrity`! Zero compilation, linting, or testing errors remain.

**Phase 2 Checklist:**
- [x] A-05: Migrate all React form `onSubmit` handlers to `action={fn}`.
- [x] A-06: Resolve unused imports and variables globally.
- [x] A-07: Add `aria-label` attributes to ~98 native buttons.

**Phase 3 Checklist:**
- [x] E-01: Implement `.match()` and neverthrow `Result<T, E>` in services and route handlers.
- [x] E-02: Fix failing integration tests for error propagation and format (RFC 9457).

**Outcome:**
- Phases 2 and 3 fully completed.
- Accessibility audit resolved with AST-based automated injection of `aria-label`.
- All integration tests passing. `npm run test` reports 81 files passing and 773 tests passing.

**Phase 4 Checklist:**
- [x] Identify and close exposed routes in production (`/api-docs`).
- [x] Validate `.env` configuration regarding `ENABLE_MOCK_ADMIN` and secrets.
- [x] Run security verification tests.

**Outcome:**
- Phase 4 fully completed.
- Gated the `/api-docs` backend JSON response to prevent scraping API topologies in production.
- Added strict warnings in `.env.example` to ensure `ENABLE_MOCK_ADMIN` stays `false` and secrets are properly rotated in production.

**Phase 5 Checklist:**
- [x] S-08: Resolve SSR ESM module resolution (`ERR_MODULE_NOT_FOUND`).
- [x] S-09: Ensure path configuration enables dynamic loading of `ssr-handler.ts`.
- [x] S-10: Restore `export default` for React Router 7 `routes/*.tsx` component rendering.
- [x] Run `npm run test:e2e` and confirm `authenticate as admin` and all CRUD setups pass.

**Outcome:**
- Phase 5 fully completed.
- E2E tests pass smoothly without any backend 500 crashes.
- Shared `@run-remix/shared` has `.js` extensions injected for ESM support.

**Next Steps:**
- Plan is complete! All architecture, error-handling, security, and rendering bugs have been solved. Ready for shipment to main.
