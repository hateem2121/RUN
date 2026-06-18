# System-Wide Audit: Phase 6 - Frontend

## FE-01: CSS import order
- **Severity**: P3 (Cosmetic)
- **File Path**: `client/app/index.css`
- **Grep Evidence**: `@import "tailwindcss";` followed by `@import "./styles/theme.css";`
- **Description**: CSS import order looks relatively standard for Tailwind v4 (`@import "tailwindcss"` at the very top). However, it contains direct keyframes and utilities inside `index.css` instead of being fully modularized across `@theme` utility sets.

## FE-02: TS6 violations
- **Severity**: P3 (Cosmetic)
- **File Path**: Monorepo-wide
- **Grep Evidence**: None found for `baseUrl`, `Object`, or `Function` types.
- **Description**: A scan for `baseUrl` in `tsconfig.json` and explicit TS6-forbidden types (`Object`, `Function`, `{}`) yielded no critical violations inside `client/` or `server/`. The repository maintains correct type declarations and `paths` aliases.

## FE-03: GSAP cleanup
- **Severity**: P1 (Major)
- **File Path**: `client/app/components/shared/manufacturing/ManufacturingAnimations.tsx`, `client/app/components/ui/animated-counter.tsx`
- **Grep Evidence**: `useEffect(() => { gsap.to(...) })`
- **Description**: Legacy React-GSAP patterns found where `gsap.to()` is called directly inside a `useEffect` instead of using the `@gsap/react` `useGSAP()` hook. This bypasses automatic cleanup and context management, causing potential memory leaks and animation ghosting.

## FE-04: locomotive-scroll singleton
- **Severity**: P3 (Cosmetic)
- **File Path**: `client/app/hooks/use-scroll.tsx`
- **Grep Evidence**: `const scroll = new LocomotiveScroll(scrollConfig);` inside `ScrollProvider`
- **Description**: Locomotive scroll is cleanly instantiated once inside `ScrollProvider` and guarded by `scrollRef.current`. `useSmoothScroll` is marked as deprecated, meaning the singleton pattern is correctly adhered to.

## FE-05: SSR-unsafe client code
- **Severity**: P0 (Critical)
- **File Path**: `client/app/components/products/UnifiedMediaTheater.tsx`
- **Grep Evidence**: `hasWebGL: (() => { try { const canvas = document.createElement("canvas"); ... } })()`
- **Description**: A `useMemo` block executes synchronous `document.createElement("canvas")` and accesses `window.WebGLRenderingContext` and `navigator.connection` without a `typeof window !== 'undefined'` guard. This will cause server-side rendering (SSR) to crash.

## FE-06: React 19 state sync
- **Severity**: P1 (Major)
- **File Path**: `client/app/routes/products.tsx`
- **Grep Evidence**: `useEffect(() => { setDisplayedProducts(sortedProducts.slice(0, itemsPerPage)); }, [sortedProducts]);`
- **Description**: An anti-pattern in React 19 where derived state (`sortedProducts`) is synced into local state (`displayedProducts`) via `useEffect`. This triggers redundant re-renders and should be computed during the render phase directly or via `useOptimistic`.

## FE-07: playsInline
- **Severity**: P3 (Cosmetic)
- **File Path**: Multiple files (e.g., `HeroSection.tsx`)
- **Grep Evidence**: `<video autoPlay muted playsInline>`
- **Description**: All reviewed instances of `<video autoPlay>` across the application correctly feature the `playsInline` attribute, ensuring compliant playback functionality on iOS mobile devices.
