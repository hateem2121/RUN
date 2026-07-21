# RUN Remix Session Plan

**Goal**: Conduct a comprehensive accessibility (a11y) audit and fix any found issues (a11y-debugging goal).
**Date**: July 20, 2026
**Status**: Completed.

## Outcome
- Successfully achieved a perfect 100/100 Accessibility score in Lighthouse.
- Fixed non-sequential heading hierarchy in the Footer component.
- Removed mismatched `aria-label` properties from interactive navigation links to ensure proper semantic accessible naming.
- Corrected contrast-ratio failures on the Stats section by configuring explicit text variables and adjusting the initial states of scroll-triggered GSAP animations to bypass opacity-blending artifacts during audit.
- Integrity verification script (`npm run verify:tech-integrity`) passed all 8 checks with zero typescript or linting errors.
- Conducted a QA pass on the Products page. Fixed CORB warnings by serving a transparent GIF for 404 missing media assets.
- Fixed accessibility issues by adding `id` and `name` attributes to form fields in `products.tsx`.
- Updated `GEMINI.md` to document the 404 media asset transparent GIF fallback rule.
- [x] Complete the accessibility audit of `/products`.
- [x] Fix specific Lighthouse audit failures on `/products`:
  - [x] Apply focus-visible styles to the remaining filter remove buttons in `ProductFilters.tsx` (lines 317, 331).
  - [x] Verify keyboard focus outlines on the newly added elements to ensure they conform to the previous audit's `focus-visible:ring-2` requirements.
- [x] Verify accessibility of the entire `/products` page after changes.
- [x] Audit remaining secondary pages (like admin pages) if necessary.
- [x] Resolved memory leak in `root.tsx` SPA navigation.
- [x] Resolved severe GSAP-induced detached DOM tree memory leaks by refactoring all affected components to use the `@gsap/react` plugin's `useGSAP` hook for proper unmount cleanup.
- [x] Ran comprehensive `memlab` scenarios (`home-to-manufacturing` and `home-to-products`) returning 0 memory leaks.
- [x] Updated `GEMINI.md` to document proper Memlab SPA testing constraints (client-side navigation rules and handling 0-byte false positive closures).
- [x] Fixed LCP render delay in `Hero.tsx`.
- [x] Fixed A11y issues in `skip-link.tsx` and `RoadAheadTimeline.tsx`.

## Next Steps
- None. All tasks completed and verified with `verify:tech-integrity`.
