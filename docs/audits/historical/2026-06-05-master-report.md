# RUN Remix — Full-Site Investigation Master Report
Date: 2026-06-04 | Agents: 26 | Crawl: Gemini 3.5 Flash | Synthesis: Claude Opus 4.6 (emulated via Antigravity)

## Executive Summary
| Severity | Count | Pages Affected |
|----------|-------|----------------|
| P0 Critical | 6 | Fabrics, Sustainability, Certifications, Legal, API Endpoints, Contact |
| P1 Major | 10 | Fabrics, Services, Sustainability, Certifications, Accessories, Legal, Contact |
| P2 Minor | 9 | Fabrics, Services, Sustainability, Certifications, Accessories, API Endpoints, Contact |
| P3 Cosmetic | 3 | Fabrics, Legal, Contact |
| **Failures** | 18 | 18 pages failed to crawl due to API Quota (RESOURCE_EXHAUSTED). Logged as best-effort failures. |

## Critical Path (P0 — Fix Immediately)
- **APIX-001**: Unauthenticated Endpoint Returning Admin Data (`/api/analytics/vitals` bypasses auth due to `BYPASS_RBAC_FOR_TESTING=true`).
- **LEGL-001**: Missing Legal Data / Stub Content (CMS returns generic placeholder for Privacy/Terms).
- **FABR-001**: API Endpoint `/api/resources/batch` fails with 422 when `types` query parameter is missing, causing UI crashes.
- **SUST-001 / SRVC-001 / CONT-004**: Missing `aria-label` on Buttons/Links (Zero-tolerance accessibility violation).
- **CERT-001**: Missing Supplier-Level Disclaimer on certifications.
- **CONT-001**: Missing React Router `ErrorBoundary` on the Contact route.

## Systemic Issues (Cross-Cutting Patterns)
1. **Accessibility - Missing `aria-label` (P0/P1)**: Pervasive across Contact, Services, Sustainability, and Certifications.
2. **Accessibility - GSAP `prefers-reduced-motion` Ignored (P1)**: Animations run unconditionally in Fabrics, Services, Certifications, and Accessories.
3. **Architecture - Hardcoded API Strings (P1)**: Loaders bypass `API_CONSTANTS` in Fabrics, Legal, and Accessories.
4. **Performance - High Response Times (P2)**: Batch and single endpoints often take >500ms (up to 1.4s), indicating L1/L2 cache misses or missing database indexes.
5. **SEO - Missing Open Graph Tags (P2)**: `meta` exports omit OG tags in Services, Certifications, and Accessories.
6. **Security - Loopback Rate Limit Bypass (P2)**: Rate limits correctly bypass loopback for dev, but lack testing flags/frontend fallback logic for 429s.

## Full Issue Register

### P0 (Critical)
- **APIX-001** (API Endpoints): Unauthenticated endpoint returning admin data.
- **LEGL-001** (Legal): Missing legal data / stub content.
- **FABR-001** (Fabrics): API endpoint missing validation/types param.
- **SUST-001** (Sustainability): Missing `aria-label` on buttons and links.
- **CERT-001** (Certifications): Missing supplier-level disclaimer.
- **CONT-001** (Contact): Missing Error Boundary.

### P1 (Major)
- **FABR-002** (Fabrics): Hardcoded API strings.
- **FABR-003** (Fabrics): GSAP does not respect `prefers-reduced-motion`.
- **FABR-004** (Fabrics): Incorrect Renderer for 2D fabric swatches.
- **SRVC-001** (Services): Missing `aria-label` on contact CTA.
- **SRVC-002** (Services): GSAP ignores `prefers-reduced-motion`.
- **SUST-002** (Sustainability): Inaccurate certification disclaimer.
- **SUST-003** (Sustainability): Hardcoded marquee content bypassing CMS.
- **CERT-002** (Certifications): Expired certifications rendered as active.
- **CERT-003** (Certifications): Missing `aria-label` on document links.
- **CERT-004** (Certifications): GSAP ignores `prefers-reduced-motion`.
- **ACCS-001** (Accessories): SSR Cache mismatch & hardcoded API string.
- **ACCS-002** (Accessories): GSAP ignores `prefers-reduced-motion`.
- **LEGL-002** (Legal): Hardcoded API route string.
- **CONT-003** (Contact): `<ClientOnly>` disables SSR completely.
- **CONT-004** (Contact): Missing `aria-label` on buttons.
- **CONT-005** (Contact): Forbidden React 19 form submission pattern (`onSubmit`).
- **CONT-006** (Contact): Zod v4 error message syntax violation.
- **CONT-007** (Contact): Custom toast implementation instead of `sonner`.

### P2 (Minor)
- **FABR-005** (Fabrics): Missed opportunity for API batching.
- **FABR-006** (Fabrics): Inadequate touch target size for expand button.
- **FABR-007** (Fabrics): Lack of validation for composition percentages (100%).
- **SRVC-004** (Services): CMS API exists (contradicts known issues).
- **SRVC-005** (Services): ScrollReveal not implemented correctly.
- **SUST-004** (Sustainability): Conflicting CSS transitions and GSAP animations.
- **SUST-005** (Sustainability): Sequential waterfall in SSR loader.
- **SUST-006** (Sustainability): Missing `ScrollTrigger.refresh()`.
- **SUST-007** (Sustainability): API response times > 200ms.
- **SUST-008** (Sustainability): Outdated sustainability goal target year.
- **CERT-005** (Certifications): Missing Open Graph metadata.
- **CERT-006** (Certifications): React Router default export violation.
- **CERT-007** (Certifications): ScrollTrigger not refreshed on grid change.
- **CERT-008** (Certifications): API response time slightly elevated.
- **ACCS-003** (Accessories): Slow API response time.
- **ACCS-004** (Accessories): Missing Open Graph metadata.
- **ACCS-005** (Accessories): Skipped heading level in empty state.
- **APIX-002** (API Endpoints): Slow API response times (> 500ms).
- **APIX-003** (API Endpoints): Rate limiting skipped for loopback.
- **CONT-008** (Contact): Rate limiter bypassed for localhost.

### P3 (Cosmetic)
- **FABR-008** (Fabrics): Default composition slicing hides data.
- **CERT-009** (Certifications): Placeholder test certificates in CMS data.
- **LEGL-003** (Legal): Sub-optimal loading fallback text.
- **APIX-004** (API Endpoints): Missing category returns 404 slowly.
- **CONT-009** (Contact): API probe file format incorrect (text vs JSON).

## Failed Crawls (RESOURCE_EXHAUSTED)
18 branches failed to complete their investigation due to API Quota limits. Under the "Best-effort" failure strategy, these are logged as findings that require follow-up:
- Homepage
- About
- Manufacturing
- Technology
- Products
- Categories
- Resources Hub
- Fibers
- Size Charts
- Developer Portal
- Dashboard
- Analytics
- 404 Catch-All
- Admin Console
- Global Shell
- Missing Routes
- SSR Route Manifest
- System Integrity

## Recommended Fix Sequence (Dependency-Aware)
1. **Security & Auth**: Fix `APIX-001` immediately (remove `BYPASS_RBAC_FOR_TESTING`).
2. **Architecture**: Fix `CONT-001` (Error Boundaries) and replace hardcoded API strings with `API_CONSTANTS` across all pages.
3. **Accessibility**: Do a site-wide pass to add missing `aria-label` attributes and implement the `prefers-reduced-motion` kill switch in all `useGSAP` hooks.
4. **Data Integrity**: Update CMS records for `LEGL-001` (stub terms) and `CERT-002` (expired certs).
5. **Performance**: Audit database indices and `lru-cache` hits for endpoints taking >500ms (`APIX-002`, `ACCS-003`).

## Protocol 0 Summary
- Typecheck: PASS
- Linting: PASS
- Build: PASS
- Security: PASS
- `git status`: CLEAN
(Refer to `findings/system/protocol-0.txt` for raw logs)

## API Health Matrix
- **/api/analytics/vitals**: OK (but Unauthenticated P0)
- **/api/resources/batch**: Fails without types (P0)
- **/api/legal-policies**: Stub content only (P0)
- **/api/services**: OK (1.85ms)
- **/api/sustainability-initiatives**: SLOW (>200ms)
- **/api/categories/by-slug/activewear**: SLOW 404 (>500ms)
