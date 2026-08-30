# RUN Remix — Active Development Rules

> **Source of Truth:** [`gemini.md`](gemini.md) — For full tech stack constraints, forbidden patterns, and architecture rules.

---

## 1. Environment & Operational Parameters

- **Dev Server Port:** **`5002`** hardcoded (never 3000). Base URL: `http://localhost:5002`.
- **Mode:** Active Development — full read/write across `client/`, `server/`, and `shared/`.
- **Execution Order:** Follow B.L.A.S.T. (`Blueprint` → `Link` → `Architect` → `Stylize` → `Trigger`).
- **Completion Standard:** Always run `npm run verify:tech-integrity` before considering any task complete.
- **Viewports:** Mobile: 375px | Tablet: 768px | Desktop: 1440px | Wide: 1920px.
- **Severity Scoring:** P0 (Critical: crash/security/data) | P1 (Major: broken feature/a11y) | P2 (Minor: layout/warning) | P3 (Cosmetic: polish).

---

## 2. Core Development & Testing Guardrails

1. **Source & Export Verification:** Always verify source file existence (`ls`/`find`) and export shape (`export function` vs class vs singleton) before writing imports.
2. **Never Use fs.writeFileSync for Tests:** Use `write_to_file` tool directly to avoid escaping template literal characters into syntax errors.
3. **Execute Tests Before Task Completion:** Run `npx vitest run <path>` on all new/modified tests before checking off sprint items.
4. **Vitest Hook Timeout Invariant:** In `vitest.config.ts`, `hookTimeout` MUST be $\ge 60000$ms and `testTimeout` $\ge 30000$ms to prevent batch concurrency timeouts.
5. **JSDOM Animation Stubbing:** Provide global stubs for `IntersectionObserver`, `window.matchMedia`, and GSAP `matchMedia` in DOM tests (JSDOM lacks layout engines).
6. **Playwright Setup & Scoping:**
   - Always import `expect` alongside `test as setup` from `@playwright/test` in `*.setup.ts`.
   - Cap Playwright workers to 2 (`workers: 2`) with `fullyParallel: false` to prevent Vite SSR development server module graph contention.
   - Use `.first()` or parent-scoped locators when using `.or()` combinators to prevent Playwright strict-mode violations.
   - Use `element.scrollIntoViewIfNeeded()` instead of `window.scrollTo()` for custom scroll layouts.
   - Admin screenshot tests MUST route through `/api/auth/mock-login?returnTo=${encodeURIComponent(route)}` and wait for DOM stabilization.
7. **Accessibility (WCAG 2.2 AA/AAA):**
   - **Scroll Regions (SC 2.1.1):** Containers with `overflow-x-auto` or `overflow-y-auto` MUST declare `tabIndex={0}`, `role="region"`, `aria-label="..."`, and visible focus rings (`focus-visible:ring-1 focus-visible:ring-manufacturing-accent`).
   - **Scroll-Padding (SC 2.4.11):** Scroll containers with sticky floating headers MUST declare `scroll-padding-top: 5rem`.
   - **Touch Targets (SC 2.5.8):** All interactive targets MUST satisfy $\ge 24\times24$px.
   - **Route Titles (SC 2.4.2):** Every route module in `client/app/routes/` MUST export `meta` returning `{ title, description }`.
8. **Fluid Typography Mobile Clamp:** Custom fluid tokens under `@theme` (e.g. `--text-display-xl`) MUST clamp mobile minimum bounds to $\le 2.125$rem (34px) with `break-words`.
9. **Direct neverthrow Service Invariant:** Service layer methods in `server/services/` MUST return `ResultAsync<T, AppError>` directly via `ResultAsync.fromPromise()`. Never declare `async` on methods wrapping logic in `new ResultAsync()`.
10. **Clean Component Replacement:** When replacing foundational layout components, purge all deprecated files, adapters, and tests; mount the new component directly; run `npm run check:knip` to assert 0 unused files or exports.

---

## 3. Documentation, Markdown & Git Hygiene

- **Identity:** All documentation and comments must reflect RUN APPAREL's 100% B2B sustainable sportswear manufacturing identity.
- **Link Checking Integrity (`npm run check:docs`):** Never hyperlink local files with line numbers (`[file.ts](file.ts:10)` — use code ticks instead). Do not link private/uninitialized discussion URLs.
- **Workspace Tooling Invariant:** Never attach `ArtifactMetadata` when writing workspace files (`write_to_file`).
- **Markdown Standards (`npm run check:md`):** Adhere to markdownlint (no consecutive blanks MD012, blanks around headings MD022, no trailing punctuation in titles MD026).
- **Mermaid Compatibility:** Use only supported Mermaid headers: `flowchart TD/LR`, `graph TD/LR`, `stateDiagram-v2`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `xychart-beta`.
- **Zero Root Clutter:** Never commit temporary debug scripts (`test-*.cjs`, `test-*.mjs`, `playwright-script.mjs`) or test dumps to root. Prune `knip.config.ts` ignore rules when deleting scratch files.
- **Knowledge Graph First:** Always prioritize `code-review-graph` MCP tools (`detect_changes_tool`, `get_impact_radius_tool`, `query_graph_tool`) before falling back to full-file scanning.
