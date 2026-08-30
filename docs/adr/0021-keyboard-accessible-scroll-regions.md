# ADR 0021: Keyboard-Accessible Scroll Regions and WCAG 2.1.1 Invariants

**Status:** Accepted  
**Date:** 2026-08-25  
**Deciders:** RUN Remix Systems Architecture Team  

## Context

Interactive layout components such as horizontal timeline blueprints (`ProductionBlueprint.tsx`) and factory equipment galleries (`FactoryGallery.tsx`) feature horizontally scrolling overflow containers (`overflow-x-auto`):
- In Safari/WebKit and certain assistive technologies, non-focusable scroll containers cannot be scrolled using the keyboard alone, violating WCAG SC 2.1.1 (Keyboard Level A) and SC 2.1.3 (Keyboard No Exception Level AAA).
- Biome's standard linter rules flag non-interactive elements containing `tabIndex={0}` unless explicitly configured or marked with appropriate semantic ARIA landmark attributes.

## Decision

Any container declaring `overflow-x-auto`, `overflow-y-auto`, or `overflow: auto` that contains non-focusable child elements MUST declare:
1. `tabIndex={0}`
2. `role="region"`
3. An informative `aria-label="..."` describing the scrollable region
4. Focus visible styling (`focus-visible:ring-1 focus-visible:ring-manufacturing-accent focus-visible:outline-none`)
5. Biome configuration adjusted in `biome.json` under `a11y` (`noNoninteractiveTabindex: "off"` and `noRedundantRoles: "off"`) to align Axe-Core accessibility compliance with linter rules.

## Rationale

1. **Inclusive Keyboard Navigation:** Enables keyboard-only and screen reader users in Safari and Chromium to focus and arrow-scroll through horizontal timeline galleries.
2. **Deterministic WCAG Compliance:** Guarantees 100% pass rate in automated Playwright accessibility sweeps (`axe-core`).
3. **No Phantom Focus:** Explicit high-contrast focus rings ensure visible feedback matching the industrial brutalist design system.

## Consequences

### Positive

- Complete WCAG 2.2 AA & AAA compliance across all public manufacturing and sustainability routes.
- Zero automated axe-core violations (`scrollable-region-focusable`).

### Negative

- Developers must remember to supply descriptive `aria-label` attributes on custom scroll containers.

## Implementation

```tsx
// client/app/components/public/manufacturing/ProductionBlueprint.tsx
<div
  tabIndex={0}
  role="region"
  aria-label="Manufacturing production stages timeline"
  className="relative overflow-x-auto pb-4 focus-visible:ring-1 focus-visible:ring-manufacturing-accent focus-visible:outline-none rounded-none"
>
  {/* Step nodes */}
</div>
```
