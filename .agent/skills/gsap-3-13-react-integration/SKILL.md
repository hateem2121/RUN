---
name: gsap-3-13-react-integration
description: |
  Complex timeline animations and scroll triggers. Triggers:
  - "gsap", "scrolltrigger", "animation", "timeline"
  - "useGSAP", "framer motion comparison"
---

# GSAP 3.13 + React 19 Integration

## Goal
Implement high-performance, complex scroll-driven and timeline-based animations while ensuring proper memory management in the React lifecycle.

## Instructions

### 1. Library Usage
- Use the `@gsap/react` package for React integration.
- ALWAYS use the `useGSAP()` hook for all GSAP animations within components.

### 2. Context Management
- Provide the component's `ref` or a `scope` string to `useGSAP()` to ensure targeted animation and automatic cleanup on unmount.
- **DO NOT** use `useEffect` for GSAP unless absolutely necessary (e.g., specific event-driven triggers outside the render cycle).

### 3. ScrollTrigger
Integrate with the project's smooth scrolling solution (e.g., Locomotive Scroll) if applicable, using the GSAP `ScrollTrigger` proxy.

## Constraints
- **NO** memory leaks: ensure all GSAP instances are killed on component unmounting (handled by `useGSAP()`).
- **ACCESSIBILITY**: Respect user motion preferences. Wrap non-essential animations in `prefers-reduced-motion` checks.
