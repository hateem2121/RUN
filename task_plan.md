# Task Plan — Manufacturing Page Comprehensive Audit

## Session: 2026-05-01

### Objective
Read-only investigative audit of the `/manufacturing` public page and `/admin/manufacturing` admin route, including CMS schema, API, and service layers.

### Protocol 0 — Session Bookends
- [ ] START: Read and update `task_plan.md` (Current)
- [ ] END: Update `findings.md` and run `npm run verify:tech-integrity`

### Investigation Phases (B.L.A.S.T.)

- [x] Phase 1: Environment & Initialization
- [x] Phase 2: Blueprint & Data Layer Audit
- [x] Phase 3: Visual & Functional Sweep
- [x] Phase 4: CMS & Admin CRUD Verification
- [x] Phase 5: Technical Integrity & Security Audit
- [x] Phase 6: Final Consolidation & Report Generation

#### Phase 1: Blueprint & Link (Data & API Mapping)
- [x] Map Drizzle tables and Zod schemas for manufacturing content
- [x] Verify API routes and service methods
- [x] Check `.env` requirements

#### Phase 2: Architect (Routing & Cache)
- [x] Trace L1/L2/L3 routing chain
- [x] Confirm SSR cache behavior (L1: lru-cache, L2: redis)

#### Phase 3: Stylize (UI & UX Audit)
- [x] Visual inspection of `/manufacturing` at 5 breakpoints
- [x] Check layout, typography, and section spacing
- [x] Audit animations (GSAP, ScrollTrigger, Locomotive Scroll)
- [x] Mobile responsiveness check (375px to 768px)

#### Phase 4: CMS & Admin UI
- [ ] Verify React 19 form patterns (action, useOptimistic, useActionState)
- [ ] Check TipTap modules and Media Library bindings

#### Phase 5: Performance, SEO & Accessibility
- [ ] Run benchmark (TTFB, LCP, CLS, INP)
- [ ] Verify SEO metadata and heading hierarchy
- [ ] Accessibility audit (WCAG AA, ARIA labels, focus rings)

#### Phase 6: Security & Tech Integrity
- [ ] Security pass (CSRF, Authentication, Sanitization)
- [ ] Code quality check (TypeScript, Biome, React 19 violations)
- [ ] Verify no forbidden libraries (framer-motion, r3f, etc.)

### Status: [/] IN PROGRESS
