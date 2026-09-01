# System Health 100/100 Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all architectural, security, database, 3D WebGL, queueing, internationalization, and accessibility gaps identified during the multi-agent forensic audit to achieve a perfect 100/100 health score across all dimensions in a standalone MacBook hosting environment.

**Architecture:** 
- **Database & Storage:** Expand encrypted database columns (`name`, `company`, `phone`, `firstName`, `lastName`) to PostgreSQL `text` type to prevent multibyte/emoji ciphertext overflow. Migrate to standalone in-process async background task worker for emails and 3D media conversions without GCP Cloud Tasks dependency.
- **Service Layer & Resilience:** Consolidate database resilience into a single Opossum circuit breaker with telemetry spans; refactor all service methods to return `ResultAsync<T, AppError>` directly (eliminating nested `async` wrappers); route direct-repository controllers through service singletons.
- **3D Graphics:** Preserve `<canvas>` in DOM during WebGL context loss to allow native `webglcontextrestored` recovery; remove global `delete window.createImageBitmap` mutation; add upfront WebGL capability detection and enforce a 100k triangle limit on server GLTF ingestion.
- **i18n, Security & a11y:** Enable Unicode-aware slug generation, preserve `dir` and `lang` in DOMPurify, apply HTML escaping with `dir="auto"` in email templates, reorder body parsers before CSRF, and fix WCAG 2.2 accessibility regions and admin route metadata.

**Tech Stack:** React 19, React Router v8, Express 5, Drizzle ORM, Neon PostgreSQL, Opossum, GSAP 3, Tailwind CSS v4, Biome 2.5, Vitest 4, Playwright 1.62.

## Global Constraints

- Dev Server Port must remain hardcoded to **`5002`** (never 3000).
- All service methods in `server/services/` MUST return `ResultAsync<T, AppError>` directly via `ResultAsync.fromPromise()`. Never declare `async` on methods wrapping logic in `new ResultAsync()`.
- Zero forbidden packages (`framer-motion`, `lenis`, `bullmq`, `pg-boss`, `@react-three/fiber`).
- All interactive elements must satisfy WCAG 2.5.8 touch targets ($\ge 24\times24$px) and sticky header scroll padding (`scroll-padding-top: 5rem`).
- Run `npm run verify:tech-integrity` (all 8 gates) and `npm test` after completion.

---

### Task 1: Database Schema Encryption Expansion (`varchar` to `text`)

**Files:**
- Modify: `shared/schemas/content/common.ts`
- Modify: `shared/schemas/users.ts`
- Test: `shared/tests/`

- [ ] **Step 1: Update Drizzle column definitions for encrypted fields**
  - Change `name`, `company`, `phone` in `common.ts` from `varchar({ length: 255 })` to `text()`.
  - Change `firstName`, `lastName` in `users.ts` from `varchar({ length: 255 })` to `text()`.
- [ ] **Step 2: Run schema unit tests**
  - Run: `npx vitest run shared/tests/`
- [ ] **Step 3: Verify build and types**
  - Run: `npm run typecheck`

---

### Task 2: Standalone In-Process Background Task Worker

**Files:**
- Create: `server/lib/tasks/in-process-queue.ts`
- Modify: `server/services/system/inquiry.service.ts`
- Modify: `server/services/tasks/media-queue.service.ts`
- Modify: `server/routes/worker.ts`
- Test: `server/tests/routes/worker.test.ts`

- [ ] **Step 1: Implement `in-process-queue.ts`**
  - Build a lightweight, asynchronous task processor with exponential backoff and error tracking.
- [ ] **Step 2: Update `inquiry.service.ts` and `media-queue.service.ts`**
  - Dispatch tasks via `inProcessQueue` when running standalone without GCP credentials.
- [ ] **Step 3: Remove `apiTier` rate-limiter bottleneck from `worker.ts`**
  - Update `server/routes/worker.ts` to ensure background workers are not throttled and media errors clear `isProcessing: false`.
- [ ] **Step 4: Run worker test suite**
  - Run: `npx vitest run server/tests/routes/worker.test.ts`

---

### Task 3: Service Layer Invariants & Circuit Breaker Consolidation

**Files:**
- Modify: `server/services/catalog/product.service.ts`
- Modify: `server/services/catalog/accessory.service.ts`
- Modify: `server/services/catalog/category.service.ts`
- Modify: `server/services/admin/admin.service.ts`
- Modify: `server/routes/core/accessories.ts`
- Modify: `server/routes/core/certificates.ts`
- Modify: `server/routes/core/size-charts.ts`
- Modify: `server/routes/resources/homepage-batch.routes.ts`
- Modify: `server/lib/db/db-retry.ts` & `server/lib/db/db-circuit-breaker.ts`
- Test: `server/tests/services/`

- [ ] **Step 1: Harmonize database retry layers**
  - Prevent 12x retry multiplication during database latencies.
- [ ] **Step 2: Return `ResultAsync` directly from service methods**
  - Eliminate nested `async` wrappers in `product.service.ts`, `accessory.service.ts`, `category.service.ts`, `admin.service.ts`.
- [ ] **Step 3: Route direct-repository routes through services**
  - Update `accessories.ts`, `certificates.ts`, `size-charts.ts`, and `homepage-batch.routes.ts`.
- [ ] **Step 4: Run service tests**
  - Run: `npx vitest run server/tests/services/`

---

### Task 4: 3D WebGL Context Recovery & Ingestion Guardrails

**Files:**
- Modify: `client/app/components/ui/UnifiedModelViewerCore.tsx`
- Modify: `client/app/lib/model-viewer-loader.ts`
- Modify: `client/app/components/ui/LazyUnifiedModelViewer.tsx`
- Modify: `server/lib/integrations/gltf-processor.ts`
- Test: `client/tests/unit/components/ui/unified-model-viewer-adversarial.test.tsx`

- [ ] **Step 1: Remove `delete window.createImageBitmap` global mutation**
  - Clean up `model-viewer-loader.ts`.
- [ ] **Step 2: Preserve `<canvas>` during WebGL context loss**
  - Update `UnifiedModelViewerCore.tsx` to keep the canvas mounted and listen for `webglcontextrestored`.
- [ ] **Step 3: Upfront WebGL capability detection**
  - Add synchronous check in `LazyUnifiedModelViewer.tsx` before bundle download.
- [ ] **Step 4: Add triangle count check to GLTF processor**
  - Update `gltf-processor.ts` to enforce max 100k triangles and 2048px textures.
- [ ] **Step 5: Run 3D tests**
  - Run: `npx vitest run client/tests/unit/components/ui/unified-model-viewer-adversarial.test.tsx`

---

### Task 5: Internationalization (Unicode Slugs, RTL & Email Escaping)

**Files:**
- Modify: `server/lib/utilities/slug-utils.ts`
- Modify: `client/app/components/admin/categories/CategoryForm.tsx`
- Modify: `server/middleware/sanitization.ts`, `server/lib/sanitize-html.ts`, `client/app/lib/sanitize-html.ts`
- Modify: `server/lib/integrations/email-service.ts`
- Test: `server/tests/lib/integrations/`

- [ ] **Step 1: Unicode-aware slug normalization**
  - Update `slug-utils.ts` and `CategoryForm.tsx` to support non-ASCII characters without erasing them.
- [ ] **Step 2: Add `dir` and `lang` to DOMPurify allowed attributes**
  - Update sanitization configs in `sanitization.ts` and `sanitize-html.ts`.
- [ ] **Step 3: HTML escape customer email variables and add `dir="auto"`**
  - Update `email-service.ts`.
- [ ] **Step 4: Run unit tests**
  - Run: `npx vitest run server/tests/`

---

### Task 6: WCAG 2.2 Accessibility, Security Middleware Ordering & Test Secrets

**Files:**
- Modify: `server/boot/middleware.ts`
- Modify: `tests/setup.ts`
- Modify: `client/app/routes/admin._index.tsx`
- Modify: `client/app/components/contact/contact-form.tsx`
- Modify: `client/app/components/ui/OfflineIndicator.tsx`
- Modify: `client/app/components/admin/AdminErrorBoundary.tsx` & `ProductErrorBoundary.tsx`
- Modify: `client/app/styles/theme.css`
- Test: `tests/unit/ssr/invariants.test.ts` & `npm run verify:tech-integrity`

- [ ] **Step 1: Reorder body parsers before CSRF middleware in `middleware.ts`**
- [ ] **Step 2: Replace test DB credentials in `tests/setup.ts` with dummy URI**
- [ ] **Step 3: Add `meta` title/description export in `admin._index.tsx`**
- [ ] **Step 4: Fix ARIA live regions and roles in `contact-form.tsx` and `OfflineIndicator.tsx`**
- [ ] **Step 5: Add `tabIndex={0}` and region labels to admin error `<pre>` containers**
- [ ] **Step 6: Clamp `.text-logotype` in `theme.css`**
- [ ] **Step 7: Execute full integrity suite**
  - Run: `npm run verify:tech-integrity`
