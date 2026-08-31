# Comprehensive Homepage Forensic Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete, zero-regression remediation of all 59 forensic findings identified in the RUN APPAREL Homepage Master Audit (`HOMEPAGE_FORENSIC_MASTER_AUDIT_REPORT.md`), securing 60fps kinetic motion, WCAG 2.2 AAA accessibility, zero CLS hydration, and robust CMS fallback resilience.

**Architecture:** A multi-workstream parallel execution model separating (1) P0 Critical Crashes & Essential Navigation, (2) P1 Major Kinetic Motion & Layout Kinematics, and (3) P2/P3 Performance, Structural Polish & Design Tokens, backed by strict Protocol 0 verification gates.

**Tech Stack:** React 19.2.7, React Router v8, Vite 8, Tailwind CSS v4.2.4 (`@theme`), GSAP 3.15 + ScrollTrigger, TanStack Query v5, Neon PostgreSQL, Biome 2.5.2, Vitest, Playwright.

**Spec:** [`HOMEPAGE_FORENSIC_MASTER_AUDIT_REPORT.md`](file:///Users/hateemjamshaid/Sites/RUN/HOMEPAGE_FORENSIC_MASTER_AUDIT_REPORT.md)

---

## 🏛️ Multi-Perspective Strategic Plan Reviews

### 1. `/plan-ceo-review` — Strategic Business & B2B User Value
- **Problem Clarity (10/10):** Broken category links, black-on-black unreadable text in light mode, and 60px cutoff on the manufacturing process pipeline directly harm high-value B2B sportswear buyer trust and inquiry conversion rates.
- **User Definition (10/10):** Global apparel brand sourcing directors, technical apparel designers, and procurement managers evaluating factory capacity and technical certifications.
- **Scope Appropriateness (10/10):** Right-sized scope covering all 59 flagged findings across the homepage without bloating into backend architectural rewrites.
- **Business Impact & ROI (10/10):** Eliminating P0 crashes and restoring full category navigation unlocks immediate catalog discovery for incoming enterprise buyers.

### 2. `/plan-eng-review` — Technical Architecture & Invariant Enforcement
- **Data Flow & Hydration Architecture:**
  - Standardizes TanStack query key `queryKeys.homepage.batch()` between SSR `root.tsx` loader and client `useHomepageData.ts`.
  - Passes SSR loader data directly as props (`heroData`) to `<Hero />` to eliminate client-side fetching waterfalls and text flashes.
- **Motion & Kinematics Architecture:**
  - Decouples kinetic skew from full-page 5000px container `contentRef` into localized text transforms clamped to $\pm 1.5^\circ$.
  - Removes orphaned `locomotive-scroll` dynamic import from `_public.tsx` to eliminate RAF frame tearing and 50KB bundle weight.
- **Error & Fallback Handling:**
  - Adds defensive null coalescing `(section.sectionType ?? "general").replace(/_/g, " ")` in `Sections.tsx`.
  - Unblocks `DEFAULT_SLOGANS` and `CATEGORIES` fallbacks when CMS API returns empty arrays.
- **Test Matrix:**
  - Unit tests for every modified component (`Hero`, `Slogans`, `Stats`, `Categories`, `FeaturedProducts`, `Values`, `Sections`, `Process`).
  - Playwright visual regression and accessibility scans across Mobile (375px), Tablet (768px), and Desktop (1440px).

### 3. `/plan-design-review` — 7-Pass UI/UX & Brutalist Design Systems
- **Pass 1 (Information Architecture):** Restores clear visual hierarchy with prominent Hero headline, smooth category marquees, and properly ordered stats (`<h3>` metric titles with tabular numbers).
- **Pass 2 (Interaction States):** Replaces false cursor button affordances with genuine interactive links on categories and products with accessible `focus-visible:` rings.
- **Pass 3 (AI Slop Risk):** Zero generic templates. Preserves RUN APPAREL's authentic industrial sportswear Brutalist identity (precision engineering since 1889).
- **Pass 4 (Design System Alignment):** Resolves missing `--spacing-container-2xl: 1600px;` and replaces hardcoded bracket gradients with `@theme` tokens.
- **Pass 5 (Responsive & Accessibility):** Guarantees zero horizontal overflow on 375px viewports, 4.5:1+ WCAG AA contrast in both light/dark modes, and pause controls for reduced motion.

---

## 📋 Workstream Task Breakdown

### Workstream 1: P0 Critical Crashes & Essential Navigation

#### Task 1: Fix Fatal `.replace()` Crash on Null `sectionType` in `Sections.tsx`
**Files:**
- Modify: `client/app/components/homepage/Sections.tsx:98-103`
- Test: `tests/unit/client/components/homepage/sections.test.tsx`

- [ ] **Step 1:** Write unit test asserting graceful rendering when `sectionType` is undefined or null.
- [ ] **Step 2:** Update `Sections.tsx:100` with null coalescing:
  ```tsx
  {(section.sectionType ?? "general").replace(/_/g, " ")}
  ```
- [ ] **Step 3:** Run test `npx vitest run tests/unit/client/components/homepage/sections.test.tsx` and verify passing.

---

#### Task 2: Add Interactive Navigation `<Link>` Elements to `Categories.tsx`
**Files:**
- Modify: `client/app/components/homepage/Categories.tsx:30-46`
- Modify: `client/app/routes/_index.tsx:156-160`
- Test: `tests/unit/client/components/homepage/categories.test.tsx`

- [ ] **Step 1:** Write unit test asserting each `CategoryMarqueeItem` renders a valid `<Link to="...">` with accessible `aria-label`.
- [ ] **Step 2:** Wrap category item content in React Router `<Link>`:
  ```tsx
  const catSlug = (cat as { slug?: string }).slug || String(cat.id || "");
  const targetUrl = catSlug ? `/categories/${catSlug}` : "/categories";
  ```
- [ ] **Step 3:** Separate GSAP `skewX` onto an outer `.marquee-skew-wrapper` and add `useReducedMotion` check.
- [ ] **Step 4:** Remove restrictive `homepageData.categories.result.length > 0` condition in `_index.tsx` so default constants render when CMS data is empty.
- [ ] **Step 5:** Run test `npx vitest run tests/unit/client/components/homepage/categories.test.tsx` and verify passing.

---

#### Task 3: Fix `CustomCursor.tsx` Color Variable & Coarse Pointer Mobile Guard
**Files:**
- Modify: `client/app/components/ui/CustomCursor.tsx:1-58, 98-115`
- Modify: `client/app/styles/theme.css:170-195`
- Test: `tests/unit/client/components/ui/custom-cursor.test.tsx`

- [ ] **Step 1:** Update `CustomCursor.tsx` to import from `@/lib/gsap` instead of raw `@gsap/react`.
- [ ] **Step 2:** Replace `var(--color-white)` with `#ffffff` across DEFAULT cursor state.
- [ ] **Step 3:** Add coarse pointer media query guard (`window.matchMedia("(pointer: coarse)")`) to prevent frozen `(0, 0)` dot on mobile/touch screens.
- [ ] **Step 4:** Verify unit tests pass.

---

#### Task 4: Harmonize TanStack Query Keys & Pass Direct SSR Props to `Hero.tsx`
**Files:**
- Modify: `client/app/root.tsx:85-90`
- Modify: `client/app/routes/_index.tsx:138-140`
- Modify: `client/app/components/homepage/Hero.tsx:1-30`
- Test: `tests/unit/client/components/homepage/hero.test.tsx`

- [ ] **Step 1:** Update `root.tsx:86` to prefetch with `queryKeys.homepage.batch()` matching `useHomepageData.ts`.
- [ ] **Step 2:** Update `Hero.tsx` to accept `heroData?: HomepageHero | null` prop from `_index.tsx` with fallback to `useHomepageData()`.
- [ ] **Step 3:** Update `_index.tsx` to pass `<Hero heroData={homepageData?.hero?.result} />`.
- [ ] **Step 4:** Verify zero hydration layout shift and zero text flashing on mount.

---

#### Task 5: Recalibrate All 7 Suspense Boundary Fallback Heights in `_index.tsx`
**Files:**
- Modify: `client/app/routes/_index.tsx:143-188`

- [ ] **Step 1:** Replace arbitrary viewport unit fallbacks (`min-h-80vh`, `min-h-60vh`, `null`) with exact component min-heights:
  - Slogans: `h-[76px]`
  - Stats: `min-h-screen md:min-h-[150vh]`
  - Categories: `min-h-[440px]`
  - Featured Products: `min-h-[2200px] sm:min-h-[1400px] lg:min-h-[950px]`
  - Values: `min-h-[1800px] md:min-h-[850px]`
  - Sections: `min-h-[900px] md:min-h-[600px]`
  - Process: `min-h-[2400px] md:min-h-screen`
- [ ] **Step 2:** Verify zero Cumulative Layout Shift (CLS) on dynamic chunk resolution.

---

### Workstream 2: P1 Major Kinetic Motion & Layout Kinematics

#### Task 6: Clamp Kinetic Scroll Skew & Add Cleanup in `_index.tsx`
**Files:**
- Modify: `client/app/routes/_index.tsx:90-132, 155`

- [ ] **Step 1:** Clamp `targetSkew` to $\pm 1.5^\circ$ with $0.001$ velocity multiplier:
  ```typescript
  const targetSkew = Math.min(Math.max(velocity * 0.001, -1.5), 1.5);
  ```
- [ ] **Step 2:** Add explicit transform cleanup (`gsap.set(el, { clearProps: "transform" })`) inside `useGSAP` return function.
- [ ] **Step 3:** Add `tabIndex={-1}` and `focus:outline-hidden` to `<main id="main-content">`.

---

#### Task 7: Fix `Process.tsx` Horizontal Pin Scrollbar Drift, Parallax & Focus Trap
**Files:**
- Modify: `client/app/components/homepage/Process.tsx:50-135, 175-235`
- Test: `tests/unit/client/components/homepage/process.test.tsx`

- [ ] **Step 1:** Replace `md:w-screen` with `md:w-full` on `.process-card` and set `sectionRef` width to `${steps.length * 100}%`.
- [ ] **Step 2:** Scope image parallax tweens to each card's individual fractional timeline window `(i - 1) * stepDuration`.
- [ ] **Step 3:** Add `onFocus` auto-scroll handler to `<Link>` buttons so keyboard tabbing brings off-screen cards into view.
- [ ] **Step 4:** Format step number overlay with zero-padded step counter `01, 02` (`step.step || index + 1`).
- [ ] **Step 5:** Add `target.onerror = null` to image error handler to prevent recursive retries.

---

#### Task 8: Fix `Values.tsx` Light Mode 1.1:1 Contrast & Accessible Ticker
**Files:**
- Modify: `client/app/components/homepage/Values.tsx:40-90, 150-170`
- Test: `tests/unit/client/components/homepage/values.test.tsx`

- [ ] **Step 1:** Update `ValuesCard` with explicit high-contrast white text (`text-white` / `text-white/80`) over dark glass overlay (`bg-linear-to-t from-black/90 via-black/40 to-transparent`).
- [ ] **Step 2:** Update cert ticker with dual mirrored tracks and `motion-reduce:overflow-x-auto` with `role="region"` and `aria-label="Industry Certifications"`.
- [ ] **Step 3:** Change `ValuesCard` hover cursor from `"button"` to `"default"`.

---

#### Task 9: Add WCAG 2.2.2 Pause Controls & Contrast Calibration to `Slogans.tsx`
**Files:**
- Modify: `client/app/components/homepage/Slogans.tsx:35-65`
- Modify: `client/app/routes/_index.tsx:143`
- Test: `tests/unit/client/components/homepage/slogans.test.tsx`

- [ ] **Step 1:** Add `hover:[animation-play-state:paused]` and `focus-within:[animation-play-state:paused]`.
- [ ] **Step 2:** Calibrate separator bullet with `text-primary dark:text-brand-lime` to exceed 4.5:1 contrast in light mode.
- [ ] **Step 3:** Render `<Slogans>` unconditionally inside `Suspense` in `_index.tsx`.

---

#### Task 10: Add One-Shot Animation Gate to `Hero.tsx` & Mobile `100dvh`
**Files:**
- Modify: `client/app/components/homepage/Hero.tsx:40-185`

- [ ] **Step 1:** Add `hasAnimatedIntro` ref to prevent entrance animation retrigger on scroll.
- [ ] **Step 2:** Gate mouse parallax listener with `prefersReducedMotion`.
- [ ] **Step 3:** Update container height to `h-screen h-[100dvh]` for mobile address bar resilience.
- [ ] **Step 4:** Replace raw `<a>` CTA tag with React Router `<Link to={...}>` and accessible `focus-visible:` ring.
- [ ] **Step 5:** Add `motion-reduce:animate-none` to spinning scroll indicator SVG.

---

#### Task 11: Preload `"Neue Stance"` Font in `root.tsx` & Purge `locomotive-scroll`
**Files:**
- Modify: `client/app/root.tsx:32-40`
- Modify: `client/app/routes/_public.tsx:1-25`

- [ ] **Step 1:** Add `<link rel="preload" href="/fonts/NeueStance-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />` in `root.tsx`.
- [ ] **Step 2:** Remove `import("locomotive-scroll")` and instantiate zero custom smooth scroll loops in `_public.tsx`.

---

### Workstream 3: P2/P3 Performance, Structural Polish & Design Tokens

#### Task 12: Refactor `ScrambleNumber` to Direct DOM Mutation & Invert Stats Headings
**Files:**
- Modify: `client/app/components/homepage/Stats.tsx:8-62, 120-188`
- Test: `tests/unit/client/components/homepage/stats.test.tsx`

- [ ] **Step 1:** Refactor `ScrambleNumber` to mutate `elementRef.current.textContent` without React state churn.
- [ ] **Step 2:** Promote `stat.label` to `<h3>` and render numerical counter inside a stylized `<div>` with `tabular-nums`.
- [ ] **Step 3:** Remove `content-auto` from the pinned section root.
- [ ] **Step 4:** Add `alt=""` and `aria-hidden="true"` to decorative background picture element.

---

#### Task 13: Standardize Featured Products Focus Rings, Landmark Tags & Width Tokens
**Files:**
- Modify: `client/app/components/homepage/FeaturedProducts.tsx:1-155`
- Modify: `client/app/styles/theme.css:300-310`
- Test: `tests/unit/client/components/homepage/featured-products.test.tsx`

- [ ] **Step 1:** Standardize imports to `import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"`.
- [ ] **Step 2:** Add `focus-visible:ring-2 focus-visible:ring-primary` to invisible card link overlay.
- [ ] **Step 3:** Replace `<section>` card tags with `<article>` or `<li>` inside a semantic list.
- [ ] **Step 4:** Add `--spacing-container-2xl: 1600px;` to `theme.css`.
- [ ] **Step 5:** Add `onClick={() => resetCursor()}` to card links and cleanup on unmount.

---

### Workstream 4: Protocol 0 Verification & Quality Gates

#### Task 14: Execute Master Verification Suite
- [ ] **Step 1:** Run `npm run check` (assert 0 TypeScript errors and 0 Biome lints).
- [ ] **Step 2:** Run `npm test` (assert all 180 Vitest suites pass cleanly).
- [ ] **Step 3:** Run `npm run check:knip` (assert 0 unused exports or dependencies).
- [ ] **Step 4:** Run `npm run check:md` and `npm run check:docs` (assert 0 markdown/link errors).
- [ ] **Step 5:** Run `npm run verify:tech-integrity` (assert all 8 quality gates pass 100%).
- [ ] **Step 6:** Run Playwright E2E tests `npx playwright test e2e/homepage.spec.ts`.

---
*Authored by Antigravity — Principal Systems Architect & Senior Front-End Engineer*
