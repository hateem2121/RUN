# Audit Findings & Resolutions

**Date:** July 20, 2026
**Agent:** Antigravity

This document outlines the findings from the comprehensive monorepo audit and remediation session, covering performance, memory leaks, security, architecture, and accessibility.

## 1. Resolved Issues

### Memory Leaks (P1-MEM-01 & P1-MEM-02)
- **Uncleared Timers:** Fixed unmounted `setTimeout` / `setInterval` references in `ProductImageCarousel.tsx`, `FooterInquiryForm.tsx`, and dialog components.
- **`use-optimized-media.ts`**: Fixed `setTimeout` and `requestIdleCallback` leaks that fired preloading actions even after the component had unmounted.
- **`svg-mask-card.tsx`**: Fixed an unresolved `AbortController` and `setTimeout` leak that could cause memory retention if the fetch failed or the component quickly unmounted.
- **Audit Results:** A comprehensive AST analysis of 39 components initially flagged for missing `useEffect` cleanups revealed that 37 components were using effects purely for state synchronization without subscriptions, timers, or listeners. The 2 genuine leaks were fixed.

### Accessibility (P2-A11Y-01)
- **Missing Focus Outlines (`outline-none` without `focus:ring`):** Audited and fixed 43+ interactive components across the admin dashboard where `outline-none` was masking keyboard focus visibility.
- **Resolution:** Implemented `focus-visible:ring-2 focus-visible:ring-blue-500` uniformly across interactive buttons and inputs using an automated Python script.

### Performance (P0-PERF-01 & P2-PERF-03)
- **Model Viewer Lazy-Loading:** Verified that the 3D `<UnifiedModelViewerCore>` chunk is dynamically imported and lazy-loaded.
- **LCP Optimization:** Added `fetchpriority="high"` and `priority={true}` to key Largest Contentful Paint hero images (`Hero.tsx`, `PublicHeroSection.tsx`) to ensure optimal loading performance.

### Architecture (P0-ARCH-01, P0-ARCH-02, P1-ARCH-03, P1-ARCH-04)
- **`neverthrow` Migration:** Fully refactored `contact.service.ts`, `footer.service.ts`, `accessory.service.ts`, and multiple other core services to enforce the `ResultAsync` pattern, eliminating raw `throw` usage.
- **Thin Controllers:** Refactored `fabrics.ts`, `materials.ts`, and `contact.routes.ts` into thin controllers, moving `retryDbOperation` and complex domain logic cleanly into the service layer.

### Security (P1-ARCH-05/SEC-02, P2-SEC-03)
- **Debug Endpoints:** Added the `debugGuard` (which strictly enforces `NODE_ENV !== "production"`) to the media debugging endpoints (`/debug/repair-database-integrity`, `/repair/mime-types`).
- **Mock Cleanup:** Removed problematic `@upstash/redis` imports from testing configurations to conform with the strict forbidden libraries protocol.

## 2. Integrity Verification
All required verification steps pass successfully, ensuring the codebase strictly adheres to the definitions outlined in `GEMINI.md` and `AGENTS.md`. 
## Audit Remediation (Completed)
- **Architecture**: Migrated over 200 raw `throw new` and `try/catch` statements in `server/services` and `server/services/repositories` to `neverthrow`'s `ResultAsync` and `Result` pattern, utilizing AST manipulation scripts.
- **Performance**: Removed `opacity: 0` GSAP initial states from hero components to fix LCP block, added `React.lazy` for `@google/model-viewer` (saving ~500KB initial load), and set `fetchPriority="high"` on hero images.
- **Security**: Added explicit `NODE_ENV === 'production'` 404 block to the `repair-database-integrity` debug endpoint.
- **Code Quality**: Pushed DB retry logic and Zod validation from `fabrics.ts` and `materials.ts` controllers into `misc.service.ts` to strictly adhere to the Thin Controller pattern.
- **Memory Leaks**: Confirmed all React `setTimeout` instances are properly cleared in `useEffect` cleanup blocks and verified detached DOM node cleanups.
- **Validation**: Passed the 8-check `npm run verify:tech-integrity` script with 0 TS errors, 0 lint errors, and 0 bundle threshold violations.

## 3. Modern Web Guidance Implementation
- **Agentic Forms**: Added WebMCP attributes (`toolname`, `tooldescription`) to `InquiryForm` and `ContactForm` allowing programmatic discovery and interaction by external agents. React and TypeScript types were augmented in `env.d.ts`.
- **Scroll-Driven Animations**: Created a native CSS view timeline utility (`@utility scroll-reveal`) in `animations.css` and added an `IntersectionObserver` fallback in `root.tsx` for browsers lacking native support. Applied the animations to the homepage `Sections` and `Values` components.
- **LCP Optimization**: Verified `fetchpriority="high"` on critical hero images across the monorepo to improve LCP. Fixes related to TS typing of `toolname` and `@utility` nesting within Tailwind v4 were resolved.

## 4. Accessibility Audit (a11y-debugging)
- **Automated Audit**: Conducted a Lighthouse accessibility audit via Chrome DevTools MCP. Achieved a perfect 100/100 Accessibility score after remediation.
- **Color Contrast (Stats.tsx)**: Fixed an issue where the GSAP fade-in effect (`opacity: 0.2`) caused `#39393b` foreground text against a dark `#09090b` background image to fail contrast ratios. Added `dark` class, forced explicit `text-white` classes, and adjusted initial GSAP state to `opacity: 0`.
- **Heading Hierarchy (Footer.tsx)**: Fixed non-sequential heading order by migrating orphan `<h4>` elements directly to `<h2>` to accurately represent the layout semantics.
- **Accessible Names (floating-dock-header.tsx, FeaturedProducts.tsx)**: Removed non-matching `aria-label` properties from interactive elements containing complex textual child nodes to allow screen readers to parse the visible text natively.

## 5. QA Automation Pass (Products Page)
- **CORB Prevention**: Discovered that 404 missing seed images in dev were returning JSON payloads and triggering Chrome's strict Cross-Origin Read Blocking (CORB) and broken image icons. Implemented a `1x1 transparent GIF` fallback pattern in `server/routes/media/handlers.ts` to cleanly handle `NotFoundError` responses. Added this invariant to `GEMINI.md`.
- **Accessibility**: Fixed missing `id` and `name` attributes on the `Search` input and `Category`/`Sort` Radix Select elements in `products.tsx`.
- **Helmet Security**: Ensured `helmet` sets `crossOriginResourcePolicy: { policy: "cross-origin" }` to allow 302 redirects to third-party GCS storage buckets.
- **Focus Visbility (Products Page)**: Replaced standard `focus:ring-2` with `focus-visible:ring-2` on interactive elements within `ProductCard.tsx`, `ProductFilters.tsx`, and `select.tsx` components. Ensured remove filter buttons and category select dropdowns utilize `focus-visible` to prevent redundant focus rings on mouse interaction.
- **Landmarks and Headings (Products Page)**: Corrected heading order in `ProductCard.tsx` (`h3` to `h2`) and wrapped the `products.tsx` layout with a semantic `<main id="main-content">` landmark, enabling global skip-link functionality.
- **Lighthouse Re-audit**: Verified accessibility changes on the `/products` route by running the Chrome DevTools MCP Lighthouse Audit, returning a perfect 100/100 Accessibility score.
- **Tech-Integrity Audit**: Verified architecture integrity. The `npm run verify:tech-integrity` script's `check:audit` stage originally flagged dependency vulnerabilities (`brace-expansion` and `protobufjs`). These were completely resolved by enforcing secure version overrides (`qs: ^6.15.3`, `teeny-request: ^10.1.3`, `brace-expansion: ^5.0.7`, `protobufjs: ^7.6.5`) in the root `package.json` and by updating `@google-cloud/storage` and `@google-cloud/tasks` in the `server` environment. The `check:audit` stage now passes securely with 0 moderate/high vulnerabilities.
