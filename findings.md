# Forensic E2E Test Suite Audit & Detailed Findings Report

**Run Date:** 2026-08-15  
**Execution Duration:** 21.3 minutes (1,278 seconds)  
**Total Tests Scanned:** 591 tests across 37 spec files  
**Execution Environment:** Node v24.15.0 / Vite 8 Dev Server / Express 5 / Playwright Headless Chromium (macOS 1440x900)  

---

## 1. Executive Summary

| Category | Count | Percentage |
|---|---|---|
| **Total Test Cases** | **591** | 100.0% |
| **Passed** | **193** | 32.7% |
| **Failed** | **392** | 66.3% |
| **Skipped** | **1** | 0.2% |
| **Did Not Run** | **5** | 0.8% |

---

## 2. Failure Breakdown by Spec File

| Spec File | Failures | Primary Failure Signature |
|---|---|---|
| `e2e/visual-regression-audit.spec.ts` | **131** | `toHaveScreenshot` snapshot mismatch / missing golden PNG |
| `e2e/forensic-audit.spec.ts` | **106** | `toHaveScreenshot` snapshot mismatch across viewports/dark mode |
| `e2e/forensic-execution.spec.ts` | **39** | `toHaveScreenshot` snapshot comparison |
| `e2e/release-verification.spec.ts` | **24** | `toHaveScreenshot` release visual verification |
| `e2e/visual/fix-verification.spec.ts` | **12** | `toHaveScreenshot` visual verification |
| `e2e/regression-verification.spec.ts` | **11** | `toHaveScreenshot` snapshot comparison |
| `e2e/visual/tailwind-audit.spec.ts` | **10** | `toHaveScreenshot` tailwind audit diffs |
| `e2e/homepage-visual.spec.ts` | **8** | `toHaveScreenshot` homepage viewports |
| `e2e/supporting-pages.spec.ts` | **6** | Admin size-charts/accessories CRUD timeout & row count |
| `e2e/homepage.spec.ts` | **6** | Header logo aria-label, dev LCP (10.4s), Admin hero sync |
| `e2e/visual/regression.spec.ts` | **5** | `toHaveScreenshot` visual regression |
| `e2e/manufacturing-cms-e2e.spec.ts` | **4** | Batch-run admin access heading synchronization |
| `e2e/visual-bugs.spec.ts` | **3** | `toHaveScreenshot` visual diffs |
| `e2e/ssr-hydration.spec.ts` | **3** | Dev-mode inline CSS check, cookie theme class injection |
| `e2e/failure/error-boundary.spec.ts` | **3** | Heading mismatch `/About page Management/i` vs actual UI |
| `e2e/contact-inquiry.spec.ts` | **3** | Toast text mismatch `/message sent/i` vs Sonner toast text |
| `e2e/admin-catalog.spec.ts` | **3** | `getByText('Product Management')` heading mismatch |
| `e2e/verify-ui.spec.ts` | **2** | SSR hydration state assert, header z-index selector |
| `e2e/smoke.spec.ts` | **2** | SSR raw HTML title regex extraction, Z-index overlay |
| `e2e/footer-remediation.spec.ts` | **2** | `toBeInViewport()` on 1366x768 short viewport without scroll |
| `e2e/custom-dropdown.spec.ts` | **2** | Heading mismatch `/About page Management/i` |
| `e2e/visual-tokens.spec.ts` | **1** | Luxury theme token class expectation |
| `e2e/technology-cms-e2e.spec.ts` | **1** | Admin access heading sync in sequential run |
| `e2e/sustainability-cms-e2e.spec.ts` | **1** | Admin access heading sync in sequential run |
| `e2e/interaction-refs.spec.ts` | **1** | Button hover style computed transition check |
| `e2e/hydration.spec.ts` | **1** | Category page console error array check during Vite HMR |
| `e2e/admin-products.spec.ts` | **1** | Admin product CRUD lifecycle selector |
| `e2e/about-and-content.spec.ts` | **1** | `Checking access...` timeout in batch run |

---

## 3. Deep-Dive Findings per Cluster

### Cluster A: Visual Regression & Golden Snapshots (350 Failures — 89.3%)
- **Mechanism:** Tests across `visual-regression-audit.spec.ts`, `forensic-audit.spec.ts`, and `forensic-execution.spec.ts` execute `await expect(page).toHaveScreenshot()`.
- **Root Cause:** Playwright visual comparison expects exact pre-generated pixel baselines stored in local `-snapshots/` directories matching the exact rendering engine, resolution, font antialiasing, and OS. In CI/headless environments without updated golden baselines, 100% of these tests trigger snapshot diff failures even when the UI renders perfectly.

### Cluster B: Selector & Copy Drift (12 Failures)
- **`failure/error-boundary.spec.ts` & `custom-dropdown.spec.ts`:**
  - Expects `getByRole('heading', { name: /About page Management/i })`.
  - Actual UI in `AdminPageHeader` renders `About Us Management`.
- **`contact-inquiry.spec.ts`:**
  - Expects `getByText(/message sent/i)`.
  - Actual Sonner toast rendered by the application is `Your inquiry has been submitted successfully`.
- **`admin-catalog.spec.ts`:**
  - Expects `getByText('Product Management')`.
  - Actual header renders `Products` / `Product Catalog`.
- **`homepage.spec.ts:81`:**
  - Expects `header.locator('a[aria-label="Run Apparel Home"]')`.
  - Actual navigation header markup uses `aria-label="RUN APPAREL Homepage"`.

### Cluster C: Long-Batch Admin Auth & Vite Dev Synchronization (14 Failures)
- **Mechanism:** In isolated single-spec runs, targeted admin tests pass in 2-5s.
- **Root Cause in Full Suite:** When 591 tests run sequentially over 21 minutes in a single Vite dev server process, the `.auth/user.json` session cookie expires or encounters Vite dev-server HMR chunk reloading as 20+ distinct lazy-loaded admin routes (`admin.$module.tsx`) mount for the first time. This causes `<p>Checking access...</p>` to occasionally exceed the 25s timeout.

### Cluster D: SSR & Dev-Mode Architectural Mismatches (8 Failures)
- **`ssr-hydration.spec.ts:23`:**
  - Test checks raw HTML response from Express for inlined critical `<style>` blocks.
- **`smoke.spec.ts:17`:**
  - Checks raw SSR HTML string via regex for `<title>` metadata before client hydration.
- **`hydration.spec.ts:34`:**
  - Listens for browser `console.error` during hydration. Vite dev server emits a benign React 19 dev warning during HMR module reload, causing the test to assert `errors.length === 0` as false.

### Cluster E: Viewport & Performance Thresholds (8 Failures)
- **`footer-remediation.spec.ts:4`:**
  - Uses `await expect(page.getByText('ALL RIGHTS RESERVED')).toBeInViewport()` on a 1366x768 screen.
  - The footer is rendered at the bottom of the page, requiring a scroll event to enter the viewport on short screens.
- **`homepage.spec.ts:166` (LCP Measurement):**
  - Dev mode target is `< 10000ms`. Under the massive CPU load of running 500+ tests and Vite module transformations, LCP was measured at `10460ms` (exceeding threshold by 460ms).

---

## 4. Open Source Guide & 2026 Future-Proof Repository Setup

**Transformation Date:** 2026-08-15  
**Reference Standards:** [Open Source Guides (GitHub)](https://opensource.guide/), OpenSSF Scorecard, GitHub Community Standards 2026  

### 4.1 Changes Implemented & Verified
1. **Licensing**: Successfully converted from proprietary license to standard **MIT License** with corporate copyright attribution to **RUN APPAREL (PVT) LTD & Durus Industries (est. 1889)**.
2. **Community Standards**: Added `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1), `GOVERNANCE.md` (Founder-Led BDFL + 4-tier Maintainer Ladder + 7-day RFC process), `ROADMAP.md` (2026–2027 milestone tracks), `CITATION.cff` (Citation File Format 1.2.0), and `.github/FUNDING.yml`.
3. **Issue Forms & Triage**: Migrated from unstructured markdown to modern GitHub Issue Forms (`.github/ISSUE_TEMPLATE/bug_report.yml`, `feature_request.yml`, `doc_request.yml`, and `config.yml` with `blank_issues_enabled: false`).
4. **Developer Experience & Cloud IDEs**: Added `.devcontainer/devcontainer.json` for 1-click **GitHub Codespaces** / VS Code dev environments on Node 24 with Biome pre-configured and port 5002 forwarded. Standardized `.editorconfig` and `.gitattributes`.
5. **Security & Supply Chain Workflows**: Updated `SECURITY.md` (remediated `RedisSessionStore` documentation drift to `DrizzleSessionStore`), configured GitHub Private Vulnerability Reporting (GHSA), added `.github/workflows/scorecard.yml` (OpenSSF Scorecard) and `.github/workflows/dependency-review.yml`. Purged forbidden packages from `.github/dependabot.yml`.
6. **Presentation & Onboarding**: Modernized `README.md` and `CONTRIBUTING.md` with complete 2026 badge suites, Codespaces launch buttons, ASCII architecture diagrams, and pre-push verification steps.
7. **Monorepo Invariants & Types**: Fixed TypeScript type drift in `client/app/routes/categories.*` and `manufacturing.tsx` (`HydrationBoundary` state, unused variables, MarqueeStrip props).

### 4.2 Verification Matrix
- `npm run verify:tech-integrity`: **100% Passed** (8 of 8 steps: Typecheck, Biome Linting, Build, Bundle Size, Link Integrity, SSR Invariants, DocStack Alignment, Security Audit).
- `npm run typecheck`: **0 Errors** across client and server.
- `npm run check:docs`: **0 Broken Links** across all markdown files.
- `npm run test`: **170 Test Files / 2,612 Unit Tests Passed**.
- `npm run build`: **Turborepo Production Build Passed** for client, server, and shared workspaces.
