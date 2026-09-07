# RUN APPAREL Footer 10/10 Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the RUN APPAREL site-wide footer and CMS management suite from a fragile visual mockup into an airtight, high-converting, 10/10 B2B industrial command center adhering to WCAG 2.2 AA accessibility, React 19 / React Router 8 standards, and strict neverthrow / Tailwind v4 architectural invariants.

**Architecture:** Unified B2B lead generation and brand trust architecture. Fixes schema contract mismatches in `@run-remix/shared`, connects real tech-pack file ingestion in Express 5 backend with rate limiting and magic-number validation, enhances React 19 frontend with Radix UI Dialog primitives and accessible pausable marquees, eliminates 768px tablet layout explosions and mobile link vanishing, bridges all CMS administration disconnects, and introduces energy-efficient smart timezone clocks.

**Tech Stack:** React 19, React Router v8, Express 5, TanStack Query 5, Tailwind CSS v4, Radix UI Dialog, Drizzle ORM, Neon PostgreSQL, neverthrow, GSAP 3, Lucide React, Vitest.

---

## Global Constraints

- Dev server port is strictly 5002 (`http://localhost:5002`).
- React 19 standards: raw `ref` prop, `<form action={...}>`, no `forwardRef`.
- Tailwind v4 standard: `@theme` tokens in `client/app/styles/theme.css`; arbitrary bracket utilities (`min-h-[600px]`, `text-[10px]`) strictly forbidden.
- neverthrow invariant: service methods return `ResultAsync` directly via `ResultAsync.fromPromise()`; no `async` wrappers returning `new ResultAsync()`.
- WCAG 2.2 AA compliance: keyboard navigation, $\ge 44\times44$px touch targets, visible focus rings, pause/stop/hide controls on animations.
- Monorepo integrity: `npm run verify:tech-integrity` must pass all 8 gates with 0 errors.

---

## Task Decomposition

### Task 1: Schema & Public Inquiry Contract Alignment (P0 Fix)

**Files:**
- Modify: `shared/schemas/contact.ts`
- Modify: `shared/schemas/content/common.ts`
- Test: `server/tests/routes/core/inquiries.test.ts`

**Interfaces:**
- Consumes: Zod schema definitions in `@run-remix/shared`.
- Produces: Resilient `createInquirySchema` accepting `projectDescription` and optional `name`, plus strictly typed `insertFooterConfigurationSchema`.

- [ ] **Step 1: Write the failing test in `server/tests/routes/core/inquiries.test.ts`**
  Add a test asserting that submitting a footer inquiry payload (`{ contact: { company: "Acme Apparel", email: "buyer@acme.com", projectDescription: "1000 Hoodies" }, source: "footer_form" }`) passes validation and creates an inquiry.
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run server/tests/routes/core/inquiries.test.ts`
  Expected: FAIL with Zod validation error ("Name is required", "Message is required").
- [ ] **Step 3: Update `shared/schemas/contact.ts`**
  Update `createInquirySchema` so `name` defaults to `company || email.split('@')[0]` and `message` accepts `message || projectDescription`.
- [ ] **Step 4: Update `shared/schemas/content/common.ts`**
  Update `insertFooterConfigurationSchema` to replace `.nullable()` with `.nullish()` and default arrays (`[]`).
- [ ] **Step 5: Re-run test to verify it passes**
  Run: `npx vitest run server/tests/routes/core/inquiries.test.ts`
  Expected: PASS.

---

### Task 2: Backend Inquiry Service & Safe Upload Route (P0 Fix)

**Files:**
- Modify: `server/routes/core/inquiries.ts`
- Modify: `server/services/system/inquiry.service.ts`
- Modify: `server/services/cms/footer.service.ts`
- Modify: `server/routes/utilities/footer-config.ts`
- Test: `server/tests/routes/core/inquiries.test.ts`

**Interfaces:**
- Consumes: Storage service / partition utilities, `createInquirySchema`.
- Produces: `POST /api/inquiries/upload-techpack` endpoint, atomic `FooterService.getFooterConfig()`, safe cache invalidation.

- [ ] **Step 1: Implement `POST /api/inquiries/upload-techpack` route**
  In `server/routes/core/inquiries.ts`, add a rate-limited public upload route for PDF/AI/DXF/ZIP/PNG files up to 25MB returning `{ assetId, fileName, fileUrl, fileSize }`.
- [ ] **Step 2: Refactor `FooterService` to direct `neverthrow`**
  In `server/services/cms/footer.service.ts`, convert `getFooterConfig()` and `updateFooterConfig()` to return `ResultAsync.fromPromise()` directly without `async` method signatures.
- [ ] **Step 3: Fix upsert race condition in `FooterService`**
  Ensure singleton deterministic query with `ORDER BY id ASC LIMIT 1` and safe JSONB array normalization.
- [ ] **Step 4: Await cache invalidation in `footer-config.ts`**
  `await unifiedCache.delete(...)` in `PATCH /admin/footer` before returning HTTP 200.
- [ ] **Step 5: Run backend tests**
  Run: `npx vitest run server/tests/routes/core/inquiries.test.ts`

---

### Task 3: Lead Generation Form & Drag-and-Drop Ingestion (P0 Fix)

**Files:**
- Modify: `client/app/components/layout/FooterInquiryForm.tsx`
- Test: `client/tests/components/layout/FooterInquiryForm.test.tsx`

**Interfaces:**
- Consumes: `/api/inquiries`, `/api/inquiries/upload-techpack`.
- Produces: Bulletproof lead submission, drag-and-drop file upload, accessible inputs with ARIA attributes.

- [ ] **Step 1: Write comprehensive tests in `client/tests/components/layout/FooterInquiryForm.test.tsx`**
  Assert form submission calls `/api/inquiries` with valid payload, drag-and-drop handles `.pdf` without page navigation, and error states display correctly.
- [ ] **Step 2: Implement real file upload and drag-and-drop**
  Add `onDragOver`, `onDragLeave`, and `onDrop` event listeners to the dropzone with `e.preventDefault()`. Upload files to `/api/inquiries/upload-techpack` and store real asset token.
- [ ] **Step 3: Connect submission payload conforming to `createInquirySchema`**
  Send `{ contact: { company, email, name: company || email.split('@')[0], message: specs }, source: "footer_form" }`.
- [ ] **Step 4: Scale heading typography and submit button**
  Replace `text-8xl` with `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` with `break-words`. Ensure button is responsive `w-full sm:w-auto`.
- [ ] **Step 5: Add ARIA accessibility**
  Add `aria-invalid`, `aria-describedby` on inputs, `:has-[:focus-visible]:ring-2` on file dropzone, and 44px tap targets.
- [ ] **Step 6: Run tests to verify**
  Run: `npx vitest run client/tests/components/layout/FooterInquiryForm.test.tsx`

---

### Task 4: Accessible Certification Marquee & Radix UI Dialog (P1 Fix)

**Files:**
- Modify: `client/app/components/layout/Footer.tsx`
- Modify: `client/app/styles/theme.css`
- Test: `client/tests/components/accessibility/RequirementR4Accessibility.test.tsx`

**Interfaces:**
- Consumes: `@radix-ui/react-dialog` via `client/app/components/ui/dialog.tsx`.
- Produces: WCAG 2.2.2 compliant marquee, accessible modal with body scroll lock.

- [ ] **Step 1: Write accessibility tests in `RequirementR4Accessibility.test.tsx`**
  Assert marquee has pause controls, duplicate elements have `aria-hidden="true"`, and Radix Dialog opens with proper focus management.
- [ ] **Step 2: Refactor certification marquee in `Footer.tsx`**
  Add `hover:[animation-play-state:paused]`, `focus-within:[animation-play-state:paused]`, and `motion-reduce:animate-none`. Add accessible Play/Pause toggle button.
- [ ] **Step 3: Hide duplicate visual loop elements from assistive tech**
  Mark cloned certificates with `aria-hidden="true"` and `tabIndex={-1}`.
- [ ] **Step 4: Replace bespoke modal with Radix `Dialog`**
  Use `Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose` from `client/app/components/ui/dialog.tsx`.
- [ ] **Step 5: Run accessibility tests**
  Run: `npx vitest run client/tests/components/accessibility/RequirementR4Accessibility.test.tsx`

---

### Task 5: Responsive Geometry, Mobile Accordion & Smart Clocks (P1 & P2 Fix)

**Files:**
- Modify: `client/app/components/layout/Footer.tsx`
- Test: `client/tests/components/accessibility/RequirementR4Accessibility.test.tsx`

**Interfaces:**
- Consumes: `footerConfig`, `useGSAP`, `IntersectionObserver`.
- Produces: 768px tablet 2-column layout, mobile accordion directory, battery-saving timezone clocks, SPA React Router navigation.

- [ ] **Step 1: Implement mobile collapsible accordion for navigation columns**
  Render columns cleanly on desktop (`md:`/`lg:`), and as accessible expandable accordions on mobile so 100% of links are accessible.
- [ ] **Step 2: Replace raw `<a>` tags with React Router `<Link>`**
  Use `<Link to={link.href}>` for internal links to eliminate full page reloads.
- [ ] **Step 3: Implement smart sleep clock with dynamic timezone calculation**
  Use `IntersectionObserver` to pause `setInterval` when footer is off-screen. Calculate Zurich CET/CEST daylight saving offset dynamically and reflect realistic operational shift hours.
- [ ] **Step 4: Synchronize GSAP ScrollTrigger**
  Add `dependencies: [footerConfig]` and `ScrollTrigger.refresh()` in `useGSAP`. Respect `prefers-reduced-motion`.
- [ ] **Step 5: Guard JSON-LD script**
  Render structured data script only when `footerConfig.structuredData` contains valid `@context` and `@type`.

---

### Task 6: Complete CMS Synchronization & Admin Safe Tabs (P2 Fix)

**Files:**
- Modify: `client/app/components/admin/footer-management/FooterManagement.tsx`
- Modify: `client/app/components/layout/Footer.tsx`
- Test: `client/tests/components/accessibility/RequirementR4Accessibility.test.tsx`

**Interfaces:**
- Consumes: `/api/admin/footer`, `footerConfiguration`.
- Produces: Tab memory safety in admin CMS, dynamic public prop wiring (`contactFormEnabled`, `contactFormHeading`, `companyAddress`, `brandTagline`, `brandText`).

- [ ] **Step 1: Add `forceMount` to `<TabsContent>` in `FooterManagement.tsx`**
  Ensure inactive tabs are hidden via CSS `data-[state=inactive]:hidden` rather than unmounted, preventing data loss on save.
- [ ] **Step 2: Add Certificate Selection UI in `FooterManagement.tsx`**
  Provide multi-select controls for `certificateIds` so admins can manage which certificates appear in the marquee.
- [ ] **Step 3: Wire CMS fields dynamically in `Footer.tsx`**
  - Conditionally render `<FooterInquiryForm />` based on `footerConfig?.contactFormEnabled`.
  - Pass `heading={footerConfig?.contactFormHeading}`.
  - Render `companyAddress` and `brandTagline`.
  - Pass `brandText` to the parallax logotype `data-content`.
- [ ] **Step 4: Fix `--hover-color` CSS consumption in `theme.css`**
  Consume `var(--hover-color)` on hover when defined.

---

### Task 7: Monorepo Verification & Protocol 0 Master Gate

- [ ] **Step 1: Run complete Vitest suite**
  Run: `npm test` (assert all tests pass).
- [ ] **Step 2: Run Protocol 0 verification gate**
  Run: `npm run verify:tech-integrity`
  Must pass all 8 gates:
  1. `typecheck` (0 errors)
  2. `lint` (0 Biome errors)
  3. `biome format .` (0 unformatted files)
  4. `check:knip` (0 unused exports/dependencies)
  5. `check:bundle` (within limits)
  6. `test` (100% passing)
  7. `verify:clean-seed` (clean database fixtures)
  8. `check:audit` (0 vulnerabilities)
- [ ] **Step 3: Manual browser validation on port 5002**
  Verify mobile (375px), tablet (768px), and desktop (1440px) rendering. Verify admin updates reflect in real-time.
