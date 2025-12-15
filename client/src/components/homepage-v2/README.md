# Architecture Decision Record: Homepage V2 Motion Stack

## Context

The Homepage component (`client/src/pages/homepage.tsx`) and its sub-components (`client/src/components/homepage-v2/*`) require high-fidelity animations, including:

- Kinetic Scroll Effects (skew, velocity-based distortion).
- 3D WebGL Backgrounds (interactive cloth simulation).
- Complex Timeline Sequences (staggered reveals, parallax).

## Decision

We have chosen to strictly use **GSAP (GreenSock Animation Platform)** and **React-Three-Fiber (R3F)** for the Homepage ecosystem, explicitly **excluding Framer Motion** from this specific scope.

### Rationale

1.  **Scroll Performance:** GSAP's `ScrollTrigger` + `Lenis` provides a more performant and fluid scroll experience for heavy "scrollytelling" layouts compared to Framer Motion's `useScroll`.
2.  **Timeline Control:** GSAP Timelines allows for precise orchestration of complex sequences involving multiple DOM elements and WebGL uniforms, which is cumbersome in Framer Motion.
3.  **WebGL Integration:** GSAP integrates seamlessly with R3F for animating shader uniforms (e.g., `uTime`, `uScroll`) without React re-render overhead.

## Architecture

- **Animation Orchestral:** `gsap.timeline()`
- **Scroll Hijacking:** `@/components/layout/LenisContext` (Lenis)
- **3D Rendering:** `@react-three/fiber` + Custom Shaders
- **State Management:** `zustand` (for cursor/loader states)

## Rules

- ❌ Do NOT use `framer-motion` for Homepage components.
- ✅ Use `useGSAP` hook for all animation side-effects.
- ✅ Keep `ScrollTrigger` instances cleaned up in `useGSAP` callbacks.
- ✅ Use `will-change-transform` CSS classes on heavy scroll sections.
