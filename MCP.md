# MCP.md — MCP Tool Stack

**Project:** RUN APPAREL CMS v4.1.2 (`run-remix`)
**Agent:** Antigravity (Gemini)
**Last updated:** August 2026
**Owner:** M. Hateem Jamshaid — RUN APPAREL (PVT) LTD, Sialkot, Pakistan

> **Hierarchy:** `gemini.md` (SSOT) → `CLAUDE.md` → `MCP.md`
> This file is a supplementary layer. All architectural rules, forbidden
> patterns, and stack constraints in `gemini.md` take absolute precedence.
> This file governs MCP server routing, invocation rules, and priority order only.

---

## 1. MCP Server Registry

### 1.1 graphify

**Source:** https://github.com/Graphify-Labs/graphify

**Purpose:** Persistent, cross-session knowledge graph of the RUN Remix codebase.
Eliminates redundant re-reading of 50+ files at the start of every session, and
answers structural questions — "what breaks if I change `withCircuit()`?" —
without opening a file.

**Registered in `.gemini/settings.json`** as the `graphify` MCP server, serving
`graphify-out/graph.json` over stdio. Ten tools: `query_graph`, `get_node`,
`get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`,
`list_prs`, `get_pr_impact`, `triage_prs`.

**Invoke FIRST on session start** — before reading `task_plan.md` or `gemini.md`.
Query the graph for the subsystem in scope, then reconcile with `task_plan.md`.

**The graph is committed to this repo.** `graphify-out/` is tracked (38 files,
~13 MB), so a fresh clone gets a working graph immediately — no rebuild needed
before the server answers. Keep it current rather than letting it drift:

```bash
graphify update .                # incremental re-extract after changes
graphify extract . --code-only   # full structural rebuild, AST only, no API key
```

Because `graph.json` is both generated and tracked, two branches that each
rebuild it will conflict on a 13 MB file. graphify ships a union merge driver
for exactly this case (`graphify merge-driver`); it is **not** configured in
this repo yet.

**Mandatory update triggers:**
- After any schema change in `shared/schemas/`
- After any architectural decision (new route, new service, new middleware)
- After every `/ship` or `/land-and-deploy`
- End of every session (see Protocol 0 amendment in §3)

**Session memory** replaces the old memory-key convention. graphify records
answered questions and their outcomes rather than free-text keys:

```bash
graphify save-result --question "..." --answer "..." --outcome useful
graphify reflect    # rolls outcomes into graphify-out/reflections/LESSONS.md
```

**Rules:**
- Never store secrets, PII, session tokens, or env values in saved results.
- If the graph is stale for the subsystem in scope, run `graphify update .` and
  re-query before trusting the answer. A stale graph answers confidently from
  the old structure — this is the main failure mode worth knowing about.
- `graphify extract` refuses to overwrite `graph.json` with a **smaller** graph.
  If a rebuild reports fewer nodes, investigate before reaching for `--force`.
- When the Uncertainty Protocol fires, query the graph for existing structure on
  the same subsystem BEFORE presenting options to the user.

**Verified behaviour (2026-08-01):**
- MCP handshake over stdio succeeds; server reports `graphify`, protocol `2024-11-05`
- Current graph: **8,824 nodes / 23,251 links / 411 communities**
- The server needs the `mcp` extra **pinned below 2.0**. `mcp` 2.x removed
  `AnyUrl` from `mcp.types` and `graphify-mcp` fails to start with a misleading
  "mcp not installed" error. Fix: `pipx inject graphifyy "mcp<2" --force`

---

### 1.2 context7-mcp

**Source:** https://github.com/upstash/context7

**Purpose:** Fetches live, version-pinned library documentation at query time.
Prevents hallucination on bleeding-edge APIs across this stack.

**MANDATORY before writing any code that uses:**

| Library | Pinned Version | Critical Patterns |
|---------|---------------|-------------------|
| React | 19.2.4 | Form actions, `useActionState`, raw ref prop, no `forwardRef` |
| React Router | ^8.0.0 | loader/action/ErrorBoundary, default exports for leaf routes |
| Vite | 8.0.10 | Rolldown bundler, `ssr.external`, `ssr.resolve` |
| TypeScript | ^6.0.3 | `ignoreDeprecations: "6.0"`, `paths` only (no `baseUrl`) |
| Drizzle ORM | 0.45.2 | Query builder chain, `drizzle-zod`, `createInsertSchema` |
| Zod | 4.2.1 | `.nullish()` not `.optional().nullable()` |
| Tailwind CSS | 4.2.4 | `@theme`, `@utility` (not `@layer utilities`) |
| TipTap | ^3.20.1 | v3 extension API only — no v2 patterns |
| Express | 5.2.1 | Async auto-catch, no `next(err)`, no `try/catch` in routes |
| Biome | 2.3.10 | `organizeImports`, `noExplicitAny: error` |
| GSAP | 3 | `useGSAP` hook, ScrollTrigger, never raw `useEffect + gsap.to()` |
| neverthrow | latest | `ResultAsync`, `.orElse()`, `.match()`, never `.unwrap()` |
| Turborepo | latest | workspace pipeline, `turbo.json` task graph |
| locomotive-scroll | 5.0.1 | Init in `_public.tsx` only, never in page components |

**Rules:**
- NEVER write a method call from memory for any library in the table above
  without first fetching its current docs via context7-mcp.
- If context7-mcp returns a version mismatch vs `package.json`, invoke the
  Uncertainty Protocol immediately — do NOT silently proceed.
- Cross-reference fetched docs against §5.1 forbidden patterns in `gemini.md`
  before applying any pattern from external documentation.

---

### 1.3 sequential-thinking-mcp

**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

**Purpose:** Enforces structured, auditable step-by-step reasoning before
code is written. Natively mirrors the B.L.A.S.T. execution order.

**Invoke BEFORE writing code for:**
- Any task modifying `shared/schemas/` or `shared/route-manifest.ts`
- Any task touching auth, sessions, CSRF, or security middleware
- Any new route (requires admin counterpart verification per §6.1)
- Any task flagged P0 or P1 severity
- Any multi-file refactor spanning more than 2 workspaces
- Before presenting Uncertainty Protocol options to the user

**B.L.A.S.T. Step Mapping:**
Step 1 → B (Blueprint) : Map all schemas, routes, types, config files
Step 2 → L (Link) : Verify API contracts, Zod schemas, env keys
Step 3 → A (Architect) : Trace full request/data flow, side effects
Step 4 → S (Stylize) : Confirm @theme tokens, GSAP patterns, design system
Step 5 → T (Trigger) : Implement, verify, ship

**Rules:**
- Never proceed to Step 5 without Steps 1–4 fully logged in the reasoning trace.
- If any step reveals scope expansion beyond the task, invoke the Uncertainty
  Protocol — do NOT self-approve.
- Steps 1–4 outputs must be presented to the user as a summary before
  implementation begins on P0/P1 tasks.

---

### 1.4 filesystem-mcp

**Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

**Purpose:** Scoped, safe file read/write access. Enforces workspace
boundaries defined in §6.1 of `gemini.md`.

**Allowed scopes (read + write):**
<project-root>/client/
<project-root>/server/
<project-root>/shared/
<project-root>/scripts/
<project-root>/docs/
<project-root>/ops/
<project-root>/e2e/
<project-root>/tests/
<project-root>/task_plan.md
<project-root>/findings.md
<project-root>/gemini.md
<project-root>/CLAUDE.md
<project-root>/MCP.md
<project-root>/AGENTS.md

**Read-only scopes:**
<project-root>/package.json
<project-root>/.github/
<project-root>/.claude/

**Forbidden (never read or write):**
<project-root>/.env → GCP Secret Manager only
<project-root>/.env.* → GCP Secret Manager only
Any path outside project root
Home directory (~/)

**Rules:**
- Always prefer filesystem-mcp for file operations over shell `cat`, `echo >`,
  or `tee` when the MCP server is available.
- Scope discipline (§17 of `gemini.md`) applies: never write to a file outside
  the task scope without explicit Uncertainty Protocol approval.
- Never read or write deprecated directories (§23 of `gemini.md`):
  `src/`, `scratch/`, `findings/`, `tools/`, `drizzle/` (root),
  `migrations/` (root), `packages/sdk/`.

---

### 1.5 playwright-mcp

**Source:** https://github.com/microsoft/playwright-mcp

**Purpose:** Direct browser control for QA, visual audit, and E2E test
execution. Integrates with the existing `e2e/` directory and gstack
`/qa` and `/browse` commands.

**Invoke for:**
- `/qa` gstack command → use playwright-mcp for live browser test execution
- `/browse` gstack command → use playwright-mcp (NOT `mcp__claude-in-chrome__*`
  tools — those are forbidden per §5.1 of `gemini.md`)
- After any route change → verify renders without white-screen
- After any auth change → verify full login flow
- `/benchmark` gstack command → measure TTFB, LCP, CLS, INP against targets in §12

**Rules:**
- ALWAYS use `getByRole`, `getByLabelText`, `getByText` selectors.
  NEVER use CSS class selectors (§5.1 of `gemini.md`).
- Dev server MUST be running on port 5002 before invoking playwright-mcp.
  Start from `server/` — never from `client/` directly.
- For SPA navigation, use `page.evaluate(() => window.__navigate('/route'))`.
  Never use `page.goto()` between heap snapshots (Memlab constraint, §6.12).
- Never run against auth-gated routes (`/admin/*`) without a seeded
  session cookie.
- Viewport targets (per `AGENTS.md`): Mobile 375px, Tablet 768px,
  Desktop 1440px, Wide 1920px.

---

### 1.6 github-mcp

**Source:** https://github.com/github/github-mcp-server

**Purpose:** Native GitHub operations within the agent loop — branch
creation, PR management, CI status monitoring.

**Invoke for:**
- Creating feature branches: `feat/`, `fix/`, `chore/`, `audit/` prefixes only
- PR creation (called internally by `/ship` gstack command)
- CI status checks during `/land-and-deploy`
- Advisory queue collision check before PR creation

**Rules:**
- NEVER commit directly to `main` — all changes via feature branches.
- PR descriptions must include:
  - Task reference from `task_plan.md`
  - B.L.A.S.T. checklist summary
  - Confirmation: `npm run verify:tech-integrity` — all 8 checks passed
- Do NOT use github-mcp to bypass `npm run check` — CI gates are non-negotiable.
- Image tags in any Kubernetes YAML committed via github-mcp: pinned version
  only — never `latest` (§5.1 of `gemini.md`).
- Secrets must reference GCP Secret Manager — never plaintext in YAML (§16).

---

### 1.7 ui-skills (Reference Library)

**Source:** https://github.com/ibelick/ui-skills

**Purpose:** Curated UI component pattern reference. Used for inspiration
and structural reference only — NOT as a copy-paste source.
All patterns must be adapted to this repo's design system before use.

**Invoke during:**
- New component creation in `client/app/components/`
- `/design-consultation` or `/design-shotgun` gstack commands
- When the design system lacks a pattern for a new UI requirement

**Mandatory adaptation rules — every pattern from ui-skills MUST be:**
- Converted to named exports: `export function Foo` (exception: leaf routes
  in `app/routes/` use `export default function Component()`)
- Restyled with Tailwind v4 `@theme` tokens — zero arbitrary values
- Animations replaced with GSAP + `useGSAP` hook — never CSS keyframes
  or framer-motion
- Icons replaced with `lucide-react` (primary) or `@tabler/icons-react` (secondary)
- Toasts replaced with `sonner ^2.0.7` — never custom toast implementations
- All dependencies cross-checked against §5.1 forbidden library list in `gemini.md`
  before any `npm install`

---

## 2. MCP Tool Priority Ladder

When multiple tools could serve the same task, strictly follow this order:
Priority 1 → graphify Query the knowledge graph before reading any file
Priority 2 → context7-mcp Check live docs before writing any code
Priority 3 → sequential-thinking Structure reasoning before implementing
Priority 4 → filesystem-mcp All file read/write operations
Priority 5 → playwright-mcp All browser/QA/E2E operations
Priority 6 → github-mcp All git/PR/CI operations
Priority 7 → ui-skills Component pattern reference

Skipping a higher-priority tool when it applies to the task is a
**protocol violation**. Document it in `findings.md` if a tool is
unavailable or returns an error.

---

## 3. Protocol 0 Amendment (MCP-Augmented Session Bookends)

**START OF SESSION (updated):**
1. Query `graphify` → load current structure of the subsystem in scope
2. Read `task_plan.md` → reconcile with memory, update with today's goal
3. Run `cat .claude/skills/gstack/VERSION` → upgrade if needed
4. Query `context7-mcp` for docs relevant to today's task scope

**END OF SESSION (updated):**
1. Write session discoveries to `findings.md`
2. Run `npm run verify:tech-integrity` → all 8 checks must pass
3. Update `task_plan.md` with outcome and next steps
4. Refresh the graph and checkpoint what was learned:
   - `graphify update .` → re-extract the files changed this session
   - `graphify save-result` → record each question the graph answered, with
     `--outcome useful|dead_end|corrected` (architectural decisions made,
     forbidden patterns encountered and resolved)
   - `graphify reflect` → roll outcomes into `graphify-out/reflections/LESSONS.md`,
     the recommended starting point for next session
5. Run `npm run check` and `npm run build` → zero errors

**These bookends are non-negotiable. The MCP amendments do not replace
the original Protocol 0 — they augment it.**

---

*MCP.md — Antigravity v4.1.2 · RUN APPAREL (PVT) LTD · August 2026*
*Governed by: `gemini.md` (SSOT) · Supplementary layer only*
