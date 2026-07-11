# ADR 0017: GSAP Animation Library over Framer Motion

**Status:** Accepted
**Date:** 2026-04-04
**Deciders:** RUN Remix Engineering Team

## Context

We need a robust animation library for complex UI animations including the sportswear configurator:
- Scroll-triggered animations
- Hero sequences
- Page transitions
- Micro-interactions

Two candidates were evaluated:
- **Framer Motion**: React-focused, declarative API, but adds ~35KB to bundle and requires React 18+ patterns.
- **GSAP (GreenSock)**: Framework-agnostic, imperative API, ~25KB core, industry standard for complex animations.

## Decision

We will use **GSAP (GreenSock Animation Platform)** with `@gsap/react` for React integration.

## Rationale

1. **Performance**: GSAP core is smaller and has better runtime performance for complex timelines.
2. **Framework Independence**: Works with React 19 without `forwardRef` or deprecated patterns.
3. **Timeline Control**: Superior sequencing capabilities for product configurator animations.
4. **Scroll Animations**: ScrollTrigger plugin provides native scroll-based animations without extra dependencies.
5. **Browser Support**: Better cross-browser compatibility and fallback handling.

## Consequences

### Positive
- Smaller bundle, better performance, more animation control.
- Industry-standard animation tool with excellent performance.
- ScrollTrigger plugin for scroll-based animations.

### Negative
- Imperative API requires careful cleanup in `useEffect` (Mitigated by `@gsap/react` `useGSAP` hook).
- Licensed (though free for most use cases).

## Implementation

```bash
npm install gsap @gsap/react
```

Use `useGSAP` hook for safe React integration:

```tsx
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

useGSAP(() => {
  gsap.to(ref.current, { rotation: 360 });
});
```
