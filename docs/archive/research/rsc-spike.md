# Research Spike: React Server Components (RSC) Optimization

> **Status:** Planned  
> **Target:** Static pages (/sustainability, /technology)  
> **Goal:** Reduce client bundle size by 30% by eliminating React hydration for static content.

## Objective

Evaluate the feasibility and impact of migrating specific routes to React Server Components (RSC) to reduce Time to Interactive (TTI) and First Input Delay (FID).

## Hypotheses

1. **Bundle Reduction:** Removing client-side React for static text/images will save ~50KB gzipped.
2. **Performance:** LCP will improve by 200ms on 4G networks.
3. **Complexity:** Migration effort is medium due to existing `framer-motion` usage (requires `use client`).

## Plan

1. **Baseline Measurement**
   - Measure bundle size of `/sustainability`
   - Measure LCP/FID via Lighthouse

2. **Prototype**
   - Create experimental branch `spike/rsc-migration`
   - Convert `sustainability.tsx` to Server Component
   - Extract interactive islands (ContactForm, Navigation) to Client Components

3. **Evaluation Criteria**
   - [ ] Build succeeds without hydration errors
   - [ ] Bundle size reduction > 20KB
   - [ ] No regression in SEO tags

## Risks

- Styling engine compatibility (Tailwind v4 is fine, but CSS-in-JS solutions might break)
- Animation libraries (`framer-motion`) need careful isolation

## Decision Matrix

| Outcome         | Action                             |
| --------------- | ---------------------------------- |
| Savings > 50KB  | **GO:** Schedule full migration    |
| Savings 20-50KB | **DEFER:** Optimize images instead |
| Savings < 20KB  | **NO-GO:** stick with SSR          |
