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
