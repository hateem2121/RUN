# Performance Budget

> **Performance Standards for RUN Remix Platform**
>
**Last Updated:** February 2026
> **Maintainer:** M. Hateem Jamshaid @ RUN APPAREL

---

## Overview

A performance budget is a set of limits that help ensure our application remains fast and responsive. This document defines the performance budgets for RUN Remix, aligned with Google's Core Web Vitals and industry best practices.

---

## Core Web Vitals Budgets

### Primary Metrics (Google's Core Web Vitals)

| Metric | Good | Needs Improvement | Poor | Target |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | **≤ 2.0s** |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms - 500ms | > 500ms | **≤ 150ms** |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | **≤ 0.05** |

### Secondary Metrics

| Metric | Good | Needs Improvement | Poor | Target |
| :--- | :--- | :--- | :--- | :--- |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | **≤ 1.5s** |
| **TTFB** (Time to First Byte) | ≤ 800ms | 800ms - 1800ms | > 1800ms | **≤ 600ms** |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms | **≤ 50ms** |

---

## Resource Budgets

### JavaScript Bundle Sizes

| Resource | Budget | Warning | Current |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle** | ≤ 150KB | > 120KB | ~100KB |
| **Total JS (gzipped)** | ≤ 400KB | > 350KB | ~300KB |
| **Per-route chunk** | ≤ 50KB | > 40KB | ~30KB |
| **Vendor chunk** | ≤ 200KB | > 180KB | ~150KB |
| **Admin bundle** | ≤ 300KB | > 250KB | ~200KB |

### CSS Bundle Sizes

| Resource | Budget | Warning | Current |
| :--- | :--- | :--- | :--- |
| **Initial CSS** | ≤ 50KB | > 40KB | ~30KB |
| **Total CSS (gzipped)** | ≤ 100KB | > 80KB | ~60KB |

### Image Budgets

| Resource Type | Budget | Format | Notes |
| :--- | :--- | :--- | :--- |
| **Hero images** | ≤ 200KB | WebP/AVIF | Responsive srcset required |
| **Product images** | ≤ 100KB | WebP | Multiple sizes for srcset |
| **Thumbnails** | ≤ 30KB | WebP | Lazy loading required |
| **3D Models (GLB)** | ≤ 2MB | GLB (Draco) | Progressive loading |
| **Icons** | ≤ 20KB | SVG | Inline or sprite |

### Font Budgets

| Resource | Budget | Format | Notes |
| :--- | :--- | :--- | :--- |
| **Primary font** | ≤ 50KB | WOFF2 | Subset to Latin |
| **Secondary font** | ≤ 30KB | WOFF2 | Subset to Latin |
| **Icon font** | ≤ 20KB | WOFF2 | Prefer SVG icons |

---

## Request Budgets

### HTTP Requests

| Page Type | Budget | Warning | Notes |
| :--- | :--- | :--- | :--- |
| **Homepage** | ≤ 50 | > 40 | Critical path only |
| **Product page** | ≤ 30 | > 25 | Lazy load below fold |
| **Admin dashboard** | ≤ 60 | > 50 | Code-split by section |
| **Category page** | ≤ 40 | > 35 | Pagination required |

### Critical Path Requests

| Metric | Budget | Notes |
| :--- | :--- | :--- |
| **Critical requests** | ≤ 10 | HTML, CSS, critical JS |
| **Blocking scripts** | ≤ 3 | Defer non-critical |
| **Render-blocking CSS** | ≤ 1 | Inline critical CSS |

---

## Timing Budgets

### Page Load Timings

| Metric | Budget | Warning | Notes |
| :--- | :--- | :--- | :--- |
| **DOM Content Loaded** | ≤ 2.0s | > 1.5s | Critical content ready |
| **Window Load** | ≤ 3.5s | > 3.0s | All resources loaded |
| **Time to Interactive** | ≤ 3.0s | > 2.5s | Fully interactive |
| **First CPU Idle** | ≤ 2.5s | > 2.0s | Main thread free |

### API Response Times

| Endpoint Type | Budget | Warning | Notes |
| :--- | :--- | :--- | :--- |
| **Product listing** | ≤ 200ms | > 150ms | Paginated, cached |
| **Product detail** | ≤ 150ms | > 100ms | Cached with Redis |
| **Search queries** | ≤ 300ms | > 250ms | Debounced input |
| **Admin operations** | ≤ 500ms | > 400ms | Background jobs for heavy ops |
| **Media uploads** | ≤ 2s | > 1.5s | Chunked upload |

---

## Memory Budgets

### Client-Side Memory

| Metric | Budget | Warning | Notes |
| :--- | :--- | :--- | :--- |
| **Heap size** | ≤ 50MB | > 40MB | Monitor for leaks |
| **DOM nodes** | ≤ 1500 | > 1200 | Virtualize long lists |
| **Event listeners** | ≤ 100 | > 80 | Clean up on unmount |

### Server-Side Memory

| Metric | Budget | Warning | Notes |
| :--- | :--- | :--- | :--- |
| **Per-request memory** | ≤ 10MB | > 8MB | Stream large responses |
| **Cache size** | ≤ 100MB | > 80MB | LRU eviction policy |

---

## Monitoring & Enforcement

### Automated Checks

#### Lighthouse CI

```yaml
# .lighthouseci/assertions.json
{
  "assertions": {
    "categories:performance": ["error", { "minScore": 0.9 }],
    "categories:accessibility": ["error", { "minScore": 0.95 }],
    "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
    "total-blocking-time": ["error", { "maxNumericValue": 200 }],
    "speed-index": ["error", { "maxNumericValue": 2000 }],
    "resource-summary:script:size": ["warn", { "maxNumericValue": 400000 }],
    "resource-summary:stylesheet:size": ["warn", { "maxNumericValue": 100000 }],
    "resource-summary:image:size": ["warn", { "maxNumericValue": 1000000 }]
  }
}
```

#### Vite Bundle Analysis

```typescript
// vite.config.ts - Bundle size limits
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router'],
        ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        query: ['@tanstack/react-query'],
      },
    },
  },
}
```

#### CI Budget Enforcement

```yaml
# .github/workflows/performance.yml
name: Performance Budget Check

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:5002/
            http://localhost:5002/products
            http://localhost:5002/about
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check bundle size
        run: |
          npm run build
          npx bundlesize
```

### Real User Monitoring (RUM)

#### Core Web Vitals Collection

```typescript
// client/app/lib/performance.ts
import { initPerformanceMonitoring, sendToAnalytics } from '@/lib/performance';

// Initialize on app load
const monitor = initPerformanceMonitoring();

// Send metrics to analytics endpoint
monitor.onMetric((report) => {
  // Only send in production
  if (import.meta.env.PROD) {
    sendToAnalytics(report);
  }
});
```

#### Alerting Thresholds

| Metric | Alert Threshold | Action |
| :--- | :--- | :--- |
| **LCP p75** | > 3.0s | Investigate immediately |
| **INP p75** | > 300ms | Review event handlers |
| **CLS p75** | > 0.15 | Check layout stability |
| **Error rate** | > 1% | Review error logs |
| **API p95** | > 1s | Check database queries |

---

## Performance Optimization Strategies

### When Budget is Exceeded

#### JavaScript Bundle Too Large

1. **Analyze bundle composition**
   ```bash
   VITE_INSPECT=true npm run build
   ```

2. **Apply code splitting**
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

3. **Remove unused dependencies**
   ```bash
   npx depcheck
   ```

4. **Use lighter alternatives**
   - Replace moment.js with date-fns
   - Replace lodash with native methods

#### CSS Bundle Too Large

1. **Purge unused styles**
   ```typescript
   // tailwind.config.ts
   export default {
     content: ['./app/**/*.{ts,tsx}'],
   }
   ```

2. **Remove unused CSS**
   ```bash
   npx purgecss --css dist/*.css --content dist/*.html
   ```

#### Images Too Large

1. **Convert to modern formats**
   ```bash
   npx sharp-cli resize 800 --format webp --quality 80
   ```

2. **Implement responsive images**
   ```tsx
   <picture>
     <source srcSet="image.webp" type="image/webp" />
     <img src="image.jpg" loading="lazy" />
   </picture>
   ```

3. **Use CDN transformations**
   ```
   https://cdn.wear-run.com/image.jpg?w=800&q=80&fm=webp
   ```

#### LCP Too Slow

1. **Preload critical resources**
   ```html
   <link rel="preload" href="/fonts/primary.woff2" as="font" type="font/woff2" crossorigin />
   ```

2. **Optimize server response**
   - Enable HTTP/2
   - Use CDN edge caching
   - Implement streaming SSR

3. **Prioritize above-fold content**
   - Inline critical CSS
   - Defer non-critical JS

#### CLS Too High

1. **Reserve space for images**
   ```css
   img {
     aspect-ratio: 16 / 9;
     width: 100%;
     height: auto;
   }
   ```

2. **Avoid layout shifts from fonts**
   ```css
   @font-face {
     font-display: optional;
   }
   ```

3. **Set explicit dimensions**
   ```tsx
   <img src="product.jpg" width="800" height="600" />
   ```

---

## Performance Review Checklist

### Before Deployment

- [ ] Lighthouse score ≥ 90 for all categories
- [ ] Bundle sizes within budget
- [ ] No render-blocking resources
- [ ] Images optimized and lazy-loaded
- [ ] Fonts preloaded with font-display: optional
- [ ] Critical CSS inlined
- [ ] Non-critical JS deferred

### After Deployment

- [ ] Core Web Vitals passing in Search Console
- [ ] RUM data shows p75 within budget
- [ ] No performance regressions in alerts
- [ ] Error rate below 1%

---

## Performance Budget Review Schedule

| Review Type | Frequency | Participants |
| :--- | :--- | :--- |
| **Automated CI check** | Every PR | CI/CD |
| **Weekly dashboard review** | Weekly | Tech Lead |
| **Monthly budget review** | Monthly | Engineering Team |
| **Quarterly optimization sprint** | Quarterly | Full Team |

---

## Tools & Resources

### Analysis Tools

- **Lighthouse** - Performance auditing
- **WebPageTest** - Detailed waterfall analysis
- **Chrome DevTools** - Runtime performance
- **Bundlephobia** - Package size analysis
- **Vite Bundle Visualizer** - Bundle composition

### Monitoring Tools

- **Google Search Console** - Core Web Vitals
- **Vercel Analytics** - Real User Monitoring
- **Sentry Performance** - Error + Performance tracking
- **Grafana** - Custom dashboards

### Documentation

- [web.dev/vitals](https://web.dev/vitals/)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

---

## Contact

For performance-related questions or concerns:

- **Email:** team@wear-run.com
- **Slack:** #engineering-performance

---

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD