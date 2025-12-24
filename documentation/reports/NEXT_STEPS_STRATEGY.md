# Strategic Roadmap: Next Steps for RUN-Remix

**Date:** December 23, 2025
**Phase:** Post-Stabilization / Growth

With the core architecture stabilized, the next phase of development should transition from "Emergency Recovery" to "System Optimization and Feature Scaling."

---

## 1. High-Priority Technical Debt

### A. CSS Maintenance

- **Purge Audit:** Conduct a deep dive into the 10+ legacy CSS files in `client/src/styles/`. Many styles are likely redundant now that the v4 system is unified.
- **Tailwind Component Migration:** Convert remaining `executive-glass-card` and `stat-card-light` classes into Tailwind `@utility` or `@component` definitions to reduce bundle size.

### B. Testing Breadth

- **Visual Regression Testing:** Expand Playwright suites to specifically target the new `z-index` layers (e.g., verifying `InquiryDrawer` is always on top of the map).
- **SSR Smoke Tests:** Implement automated checks for "About" and "Products" pages that verify the presence of critical CSS links in the HTML response.

---

## 2. Performance & UX Optimizations

### A. Asset Pipeline

- **WebP/Avif Transition:** Implement a server-side image transformation layer or ensure all `OptimizedImage` components are utilizing responsive `srcset` for v4-compliant fluid layouts.
- **Font Optimization:** Re-verify the "Neue Stance" font delivery. Currently using a system fallback due to potential file corruption or loading issues in index.css.

### B. React Query Refinement

- **Query Prefetching:** Implement prefetching for the "Products" catalog on hover of the navigation links to further reduce perceived load time.
- **Cache Persistence:** Explore `persister` plugins for React Query to maintain state across hard refreshes for the `InquiryCart`.

---

## 3. Proposed Feature Roadmap

### A. Advanced B2B Features

- **Project Inquiry Workspace:** A dedicated dashboard for users to manage multiple inquiry drafts before submission.
- **Interactive Fabric Portfolio:** Leveraging the new unified CSS to build a high-performance, WebGL-enhanced fabric viewer.

### B. Admin CMS Enhancements

- **Live Preview:** Implement a "Preview Mode" that utilizes the `ssr-handler.ts` to show exact production rendering within the CMS before publishing.
- **Performance Monitor Dashboard:** Integrate the performance analysis tools directly into the Admin UI for real-time monitoring.

---

## 4. Immediate Action Items (Next 72 Hours)

1.  **Verify Production Build:** Run a full production build (`npm run build`) and test the output in a staging-like environment to confirm manifest lookups are 100% accurate.
2.  **User Acceptance Testing (UAT):** Request the product owner to verify the "About" page map interaction and "Products" page typography.
3.  **Clean up Artifacts:** Remove the `.antigravityignore` and other temporary debug files created during the surge.
