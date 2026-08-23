# RUN Remix — Active Development Rules

> **Note:** See [`docs/core/AGENTS.md`](docs/core/AGENTS.md) for the agent-role directory.
> **Source of Truth: `gemini.md`**
>
> This file contains active-development rules unique to this workspace.
> For all tech-stack constraints, forbidden patterns, architectural rules,
> server file conventions, and deprecated directories, see `gemini.md`.

---

## Environment

- Server port: 5002 (never 3000)
- Base URL: http://localhost:5002
- Mode: Active Development — full read/write access to client/, server/, and shared/

## Scope

- Full implementation access across the monorepo.
- Follow B.L.A.S.T. execution order for all tasks.
- Always run `npm run verify:tech-integrity` before considering a feature complete.

## Documentation & Markdown Constraints

- **Identity:** All generated documentation, SOPs, and code comments must reflect RUN APPAREL (PVT) LTD's "100% B2B, premium sustainable manufacturing identity."
- **Link Checking:** `npm run check:docs` runs rigorously in CI. To prevent pipeline failures:
  - Do not hyperlink private repository URLs (use `<repository-url>` or plain text).
  - Do not hyperlink local files with line-number fragments (e.g., `[file.ts](file.ts:10)`). Use inline code ticks instead.
- **Mermaid Diagram Compatibility:** When creating diagrams in Markdown or artifacts, ONLY use supported Mermaid headers: `flowchart TD` / `flowchart LR`, `graph TD` / `graph LR`, `stateDiagram-v2`, `sequenceDiagram`, `classDiagram`, `erDiagram`, or `xychart-beta`. NEVER use `gantt`, `timeline`, or other unsupported diagram types that cause client-side rendering failures.

## Browser Viewports

- Mobile:  375px
- Tablet:  768px
- Desktop: 1440px
- Wide:    1920px (check max-width constraints)

## Severity Scoring

- P0: Critical — broken, crash, security issue, data missing
- P1: Major — feature broken, SEO invisible, significant a11y failure
- P2: Minor — layout issue, slow endpoint, non-critical warning
- P3: Cosmetic — visual polish, minor inconsistency

## Model Routing

- Crawling, screenshots, API probing: @gemini-3.5-flash
- Report synthesis, pattern analysis: @claude-opus-4-6

---

> **Cross-reference:** Tech stack (§4), forbidden patterns (§5), architecture (§6),
> server file conventions (§22), deprecated directories (§23), GSAP rules (§6.8),
> auth & sessions (§6.10), CSP nonce & Vite SSR (§6.11) — all in `gemini.md`.

## Communication Guardrails

- **Artifact Transparency**: Never mention or present the internal `task.md` system artifact to the user. When discussing sprint goals, tracking, or checklists, refer EXCLUSIVELY to the `task_plan.md` file required by Protocol 0.

## Test Generation Guardrails

When creating or generating unit test files:

1. **Verify source file existence before writing imports.** Never guess file names. Always `ls` or `find` the target directory first. This monorepo uses inconsistent naming conventions (e.g., `auth-service.ts` vs `blog.service.ts`, hyphens vs dots), so path inference is unreliable.

2. **Verify export shape before importing.** Before writing `new Foo()`, `import { foo }`, or `import * as foo`, inspect the first ~10 lines of the source file (or grep for `export`) to confirm whether it exports a class, a singleton instance, or named functions.

3. **Never use `fs.writeFileSync` to generate TypeScript test files.** Use the `write_to_file` tool directly for each file. When file content is built as a JavaScript string and written with `fs.writeFileSync`, template literal `\n` characters can be double-escaped into literal `\\n`, causing OXC/Vite parse errors.

4. **Always run the new tests before marking task items complete.** Execute `npx vitest run <path>` on the newly created test files to confirm they parse and pass before checking off items in `task.md`.

5. **CLI Tool & Script Testing:** When writing tests for CLI scripts (e.g., in `scripts/`), ensure the target script's execution blocks are wrapped in `if (process.env.NODE_ENV !== "test")`. Importing scripts that contain top-level `process.exit()` calls will crash the Vitest runner prematurely.

6. **JSDOM Animation Stubbing:** When writing DOM-based React tests for components that utilize GSAP (`ScrollTrigger`) or `locomotive-scroll`, you must provide extensive global stubs for `IntersectionObserver`, `window.matchMedia`, and GSAP's matchMedia hooks, as JSDOM does not support layout engines.

7. **Playwright Setup Imports:** When creating or editing Playwright setup files (`*.setup.ts`), always explicitly import `expect` alongside `test as setup` from `@playwright/test` to prevent runtime `ReferenceError: expect is not defined` from breaking dependent test suites.

8. **Vite SSR Worker Throttling:** When running Playwright against a single local Vite SSR development server, cap test workers to 2 (`--workers=2` or `workers: 2`) to prevent simultaneous dynamic import requests (`app/entry.client.tsx`) from causing HMR module graph contention.

9. **Strict-Mode Locator Scoping:** When using `.or()` combinators in Playwright assertions where multiple matching elements might exist (e.g., both breadcrumbs and headings matching the same phrase), always chain `.first()` or scope locators by parent container to avoid strict mode violations.

10. **Smooth-Scroll Element Reachability:** When testing element visibility in layouts using `locomotive-scroll` or custom scroll containers, use `element.scrollIntoViewIfNeeded()` directly rather than `window.scrollTo()`.

11. **Admin Visual Capture Authentication:** Screenshot capture harnesses and visual regression tests targeting `/admin/*` routes MUST route through `/api/auth/mock-login?returnTo=${encodeURIComponent(route)}` and wait for DOM stabilization (`Checking access...` removed) before taking snapshots.

12. **Fluid Typography Mobile Clamp Bounds:** Any fluid display typography token registered under `@theme` (e.g. `--text-display-xl`) consumed by uppercase brutalist headings MUST clamp the mobile minimum bound to `≤ 2.125rem` (34px) to prevent long words from clipping on 375px viewports.

13. **WCAG 2.2 Scroll-Padding Invariant:** All scroll containers with sticky floating headers MUST declare `scroll-padding-top: 5rem` to guarantee keyboard focus is never obscured (SC 2.4.11). All interactive touch targets MUST satisfy `≥ 24×24px` (SC 2.5.8).

### 6.11 React Router v8 & Vite 8 Resolution Rules (Addendum)

- **CSP Nonce Hydration Mismatch**: In React 19, Chrome hides the `nonce` attribute on `<link>` tags for security, causing a fatal hydration mismatch if the Virtual DOM expects a value. When rendering React Router's `<Links />` component in the root layout or error boundaries, you **MUST** pass an empty string on the client (e.g., `<Links nonce="" />`) to bypass the mismatch and prevent React from crashing the client-side render tree.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

### Known Limitations & False Positives

- **Community Aggregation:** The graph may bundle `shared/schemas` into backend DB communities. Imports of shared Zod schemas in `client/` do NOT violate the DB-access rule.
- **Fuzzy Matching:** Abstract variable names (e.g., `payload`) can sometimes trigger false "indirect call" inferred edges to similarly named functions in external scripts. Always verify "Surprising Connections" in code before citing them.
- **Tool Schema Validation:** The `get_affected_flows_tool` does NOT accept a `detail_level` argument. Passing it will cause a Pydantic validation error. Always call it without this argument.
