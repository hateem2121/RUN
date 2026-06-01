# 🔍 INVESTIGATE: System Integrity Audit
**Route**: `Full monorepo`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002Full monorepo`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/sysi/`
**Issue ID Prefix**: `SYSI-`

---
## Goal
Run a complete system-wide integrity audit across the entire monorepo: Protocol 0 (8 checks), Biome linting, TypeScript compilation, technical debt, security posture, dependency health, and environment configuration.

---

## Context
**Scope**: All of `client/`, `server/`, `shared/`
**Known Pre-existing Issues**:
- 9+ files with `noExplicitAny` Biome warnings: `FeaturedProducts.tsx`, `use-toast.ts`, `queryClient.ts`, `unified-cache.ts` + 5 others
- All manufacturing route files use `.js` extension (TypeScript gap)
- `useProductForm.ts` TODO: slug checker not implemented
- `GEMINI.md` documentation outdated (route mismatches)

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/system-integrity/protocol-0.txt`.
Continue regardless of failures — every failure is itself a finding.

```bash
npm run verify:tech-integrity   # 8-point integrity gate
npm run check                   # Biome 2.4.10 lint + TypeScript 6.0.3
npm run build                   # Zero-error production build
git diff --name-only            # Confirm no source files modified
```

---
## Agent Team Configuration (Antigravity 2.0 — Agent Teams Panel)

| Sub-Agent | Model | Responsibility |
|-----------|-------|----------------|
| Visual Crawler | `@gemini-3.5-flash` | Browser screenshots 375/768/1440px, layout, animation |
| CMS + API Auditor | `@gemini-3.5-flash` | Schema, endpoint probe, admin→frontend data flow |
| Perf + SEO + a11y | `@gemini-3.5-flash` | Web Vitals, metadata, Biome, accessibility |
| **Synthesizer** | **`@claude-opus-4-6`** | **Aggregates all output → `findings.md`** |

All three crawl agents run in **parallel**. Synthesizer runs after all complete (fan-in).

---

## Audit Axes

### 1. Protocol 0 — All 8 Checks
```bash
npm run verify:tech-integrity 2>&1 | tee findings/system-integrity/protocol-0.txt
```
- [ ] Document which of the 8 checks pass / fail
- [ ] Each failure categorized by severity (P0/P1/P2)

### 2. Biome 2.4.10 Full Scan
```bash
npx biome check --reporter=json . 2>&1 | tee findings/system-integrity/biome-full.json
npx biome check . 2>&1 | tee findings/system-integrity/biome-report.txt
```
- [ ] Total violation count by rule
- [ ] `noExplicitAny`: find ALL instances — list each file + line number
  - Known 4: `FeaturedProducts.tsx`, `use-toast.ts`, `queryClient.ts`, `unified-cache.ts`
  - Find the remaining 5+
- [ ] `noMisusedPromises` (Biome 2.4.10): all violations
- [ ] Group violations: errors vs warnings

### 3. TypeScript 6.0.3 Compilation
```bash
npx tsc --noEmit 2>&1 | tee findings/system-integrity/typescript-errors.txt
```
- [ ] Total error count
- [ ] `ignoreDeprecations: "6.0"` present in `tsconfig.json`?
- [ ] No `baseUrl` (TS6 uses `paths` only)
- [ ] `.react-router/types` in `rootDirs`?

### 4. Build Integrity
```bash
npm run build 2>&1 | tee findings/system-integrity/build-output.txt
```
- [ ] Build completes without errors
- [ ] Document all chunk sizes (any chunk > 500kb = P2)
- [ ] Vite 8 / Rolldown 1.0: no deprecated config patterns

### 5. Technical Debt Register
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|DEPRECATED" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git . \
  2>&1 | tee findings/system-integrity/tech-debt.txt
```
- [ ] Total count
- [ ] **Priority**: `useProductForm.ts` slug checker TODO — document as P1
- [ ] Categorize all: P0 / P1 / P2 / P3

### 6. Security Posture
```bash
# Check for env vars leaking to client
grep -rn "process.env" --include="*.ts" --include="*.tsx" client/ | grep -v "NODE_ENV"

# Check dev-only endpoints are gated
grep -n "mock-login\|NODE_ENV" server/routes/auth.ts

# Check Swagger visibility
grep -n "NODE_ENV\|/docs" server/boot/routes.ts
```
- [ ] No `process.env.*` leaking to client (except `NODE_ENV`)
- [ ] `mock-login`: gated by `NODE_ENV !== 'production'`
- [ ] `/api/dev/*`, `/api/debug/*`, `/api/kv-*`: all production-blocked
- [ ] Swagger (`/docs`): disabled in production
- [ ] Prometheus (`/metrics`): protected (not publicly accessible)?
- [ ] Session cookie security: `HttpOnly`, `Secure`, `SameSite` flags

### 7. .js Route File Audit
```bash
find server/routes -name "*.js" | grep -v node_modules | tee findings/system-integrity/js-route-files.txt
```
- [ ] Count all `.js` route files
- [ ] Known: all 5 manufacturing route files
- [ ] Any other `.js` route files outside manufacturing?
- [ ] All flagged as P2 tech debt (TypeScript consistency)

### 8. Dependency Audit
```bash
npm audit --json 2>&1 | tee findings/system-integrity/dependency-audit.json
```
- [ ] Count: high + critical vulnerabilities
- [ ] Any critical CVE → P0 finding
- [ ] Verify exact versions: Biome `2.4.10`, React `19.2.6`, Vite `8.0.14`, Zod `4.4.3`

### 9. Environment Config
- [ ] `.env` not committed to git:
  ```bash
  git log --all --diff-filter=A -- .env .env.local .env.* | head -5
  ```
- [ ] Port 5002 consistent: `grep -r "PORT" . --include="*.ts" | grep -v "node_modules" | grep -v "5002"`
- [ ] `NODE_ENV` set correctly for local dev: `echo $NODE_ENV`

### 10. Package.json Scripts Integrity
- [ ] `npm run verify:tech-integrity` script: runs all 8 Protocol 0 checks
- [ ] `npm run check`: invokes Biome correctly
- [ ] `npm run build`: uses Turborepo (no single-package shortcuts)
- [ ] No `PORT=3000` in any script definition

---
## Artifacts to Produce

```
findings/sysi/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### SYSI-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 0 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
