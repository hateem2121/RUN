# ADR 0017: GSAP Animation Library

**Status:** Accepted
**Date:** 2026-04-04
**Author:** RUN Remix Engineering Team

## Context

We need a robust animation library for complex UI animations including:
- Scroll-triggered animations
- Hero sequences
- Page transitions
- Micro-interactions

## Decision

We will use **GSAP (GreenSock Animation Platform)** with `@gsap/react` for React integration.

### Alternatives Considered

1. **Framer Motion** - Good for React but less powerful for complex timelines
2. **React Spring** - Physics-based, less control over easing
3. **Native CSS/JS** - Too low-level, poor cross-browser consistency

## Consequences

### Positive

- Industry-standard animation tool with excellent performance
- ScrollTrigger plugin for scroll-based animations
- React hooks integration via `@gsap/react`
- Extensive easing functions and timeline control

### Negative

- Larger bundle size (~60KB core + plugins)
- Licensed (though free for most use cases)

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