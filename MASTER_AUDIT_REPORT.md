# RUN Remix v4.0.3 — Master Audit Report & Remediation Roadmap

## Executive Summary
An exhaustive, system-wide forensic audit of the RUN Remix monorepo has been completed across three phases:
1. **Phase 1:** Environment and Protocol Check (`verify:tech-integrity`)
2. **Phase 2:** Hard Rules Audit (H01–H35)
3. **Phase 3:** Security Invariants Verification (SEC-01–SEC-10)

This read-only investigation uncovered substantial violations of architectural laws, security invariants, and engineering conventions that must be remediated to meet production-quality requirements.

---

## Phase 1: Tech Integrity Baseline (`npm run verify:tech-integrity`)

- **TypeScript:** **FAIL** (15 errors)
- **Biome lint:** **FAIL** (71 errors, 17 warnings, 37 infos)
- **Biome format:** **FAIL** (Formatting violations detected)
- **knip dead code:** **FAIL** (6 unused files, 1 unused dependency, 14 unused devDependencies, 335 unused exports)
- **Bundle size:** **PASS** (All within size limits)
- **Dependency audit:** **FAIL** (51 vulnerabilities: 10 high, 40 moderate, 1 low)

---

## Phase 2: Hard Rules Scan (H01–H35)

Automated scanning of the monorepo codebase identified the following violations (ordered by severity and count):

### High Volume Violations (>100 instances)
- **H35 (`/context-save` references):** 1358 violations
- **H07 (Arbitrary Tailwind Values):** 403 violations
- **H26 (Accessible Labels on Interactive Elements):** 176 violations
- **H11 (sonner Only for Toasts):** 150 violations
- **H25 (Playwright A11Y Selectors Only):** 149 violations
- **H15 (Types from @run-remix/shared Only):** 141 violations
- **H16 (Zod Schemas in shared/ Only):** 128 violations

### Medium Volume Violations (10-100 instances)
- **H17 (No bullmq / Job Queue Libraries):** 57 violations
- **H03 (Named Exports in components/, Default in routes/):** 28 violations
- **H22 (No mcp__claude-in-chrome__* Tool References):** 24 violations
- **H18 (ioredis Only — No @upstash/redis / connect-redis):** 23 violations
- **H04 (Form Actions Not onSubmit):** 22 violations
- **H32 (opossum Circuit Breakers on External Calls):** 18 violations
- **H19 (No @sentry/node):** 11 violations

### Low Volume Violations (<10 instances)
- **H12 (No try/catch in Express Route Handlers):** 4 violations
- **H01 (Port Law 5002 only):** 3 violations
- **H28 (Vite 8 Config Only — No esbuild / Rollup Patterns):** 2 violations
- **H30 (lucide-react Primary Icon Library):** 2 violations
- **H31 (neverthrow Result Types — No Raw throw in Services):** 2 violations
- **H08 (No framer-motion):** 1 violation
- **H09 (No lenis):** 1 violation
- **H27 (verify:tech-integrity in CI):** 1 violation
- **H34 (Dev Scripts Run from Root Only):** 1 violation

---

## Phase 3: Security Invariants (SEC-01–SEC-10)

### 🔴 Critical Failures / Partial Violations
- **SEC-01 (Server-Side XSS Sanitisation):** Partial violations detected. While `isomorphic-dompurify` is used, some routes access `req.body.content` without explicit sanitisation checks.
- **SEC-10 (Input Validation on All API Endpoints):** Partial failure. Explicit casting (e.g., `req.body.initiatives as InitiativeSortItem[]`) bypassing Zod validation was found in `sustainability-initiatives.routes.ts`.

### 🟡 Warnings
- **SEC-04 (ioredis Session Store):** `MemoryStore` is present as a fallback in `auth-service.ts`. While logged as a warning for local dev, strict environment gating is required to prevent its use in production.

### 🟢 Passes
- **SEC-02 (CSRF Protection):** Comprehensive Double-Submit Cookie pattern middleware implemented.
- **SEC-03 (Session Security):** Session rotation/regeneration and User-Agent hashing are implemented.
- **SEC-05 (Admin Route Auth):** Middleware correctly gated under `/api/admin`.
- **SEC-06 (Rate Limiting):** Diverse rate limiters (`apiRateLimiter`, `authRateLimiter`, etc.) are configured.
- **SEC-08 (WebSocket Authentication):** No insecure instantiations found.
- **SEC-09 (HTTP Security Headers):** `helmet` and Content-Security-Policy integrated.

---

## Remediation Roadmap

The following prioritized roadmap provides an ordered strategy for resolving the violations:

### P0: Critical Infrastructure & Security
1. **Security Vulnerabilities (Phase 1 & 3):**
   - Resolve 51 npm dependency vulnerabilities (especially the 10 High severity).
   - Implement strict Zod validation replacing unsafe type casts (SEC-10) in `sustainability-initiatives.routes.ts`.
   - Enforce explicit `isomorphic-dompurify` on all `req.body.content` routes (SEC-01).
2. **TypeScript & Biome Errors:**
   - Resolve the 15 TypeScript compilation errors blocking reliable builds.
   - Fix the 71 Biome lint errors to restore `verify:tech-integrity` parity.
3. **Architectural Hard Rules:**
   - Fix 4 `try/catch` block violations in Express Route Handlers (H12).
   - Convert 2 raw `throw` instances to `neverthrow` Results in Services (H31).
   - Address 1 `framer-motion` (H08) and 1 `lenis` (H09) rogue imports.

### P1: Component & Form Architecture
1. **React 19 Forms:** Migrate the 22 `onSubmit` handlers to `action=` forms (H04).
2. **Exports:** Fix 28 Named Export violations (H03).
3. **Tailwind:** Tokenize the 403 Arbitrary Tailwind Values (H07) into the `@theme` directive.
4. **Shared Typing:** Centralize 141 Types (H15) and 128 Zod schemas (H16) into `@run-remix/shared`.

### P2: Tooling, Accessibility, & Optimization
1. **Accessibility:** Rectify 176 missing accessible labels (H26) and update 149 Playwright selectors (H25) to use `getByRole`/`getByLabelText`.
2. **Third-party Libraries:** 
   - Standardize 150 instances on `sonner` for Toasts (H11).
   - Replace 57 `bullmq` queue library instances (H17).
   - Standardize 23 `ioredis` instances over alternatives (H18).
3. **Dead Code:** Clean up 335 unused exports and 6 unused files reported by Knip.
4. **General Cleanups:** Remove 1358 `/context-save` references (H35) and 24 `mcp__claude-in-chrome__*` references (H22).
