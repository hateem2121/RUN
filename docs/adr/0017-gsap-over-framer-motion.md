# ADR 0017: GSAP over Framer Motion

**Status**: Accepted  
**Date**: 2026-04-04  
**Deciders**: Engineering Team

## Context

The project needed a robust animation library for the sportswear configurator. Two candidates were evaluated:
- **Framer Motion**: React-focused, declarative API, but adds ~35KB to bundle and requires React 18+ patterns
- **GSAP (GreenSock)**: Framework-agnostic, imperative API, ~25KB core, industry standard for complex animations

## Decision

Choose **GSAP** as the primary animation library.

## Rationale

1. **Performance**: GSAP core is smaller and has better runtime performance for complex timelines
2. **Framework Independence**: Works with React 19 without forwardRef or deprecated patterns
3. **Timeline Control**: Superior sequencing capabilities for product configurator animations
4. **Scroll Animations**: ScrollTrigger plugin provides native scroll-based animations without extra deps
5. **Browser Support**: Better cross-browser compatibility and fallback handling

## Consequences

- **Positive**: Smaller bundle, better performance, more animation control
- **Negative**: Imperative API requires careful cleanup in useEffect
- **Mitigation**: Use @gsap/react useGSAP hook for automatic cleanup
