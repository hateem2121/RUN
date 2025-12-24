## Performance Metrics (Post-Migration Dec 2025)

After React 19 + Vite 7 + Tailwind v4 migration:

- **Lighthouse Performance**: 92/100 (Target Met)
- **CLS**: < 0.1 (Good - 90% Improvement)
- **Initial Bundle Load**: Main thread unblocked via Navigation lazy loading (~448KB critical path)
- **Build Time**: ~24s
- **SSR TTFB**: ~62ms (Baseline established Dec 2025)

See `MIGRATION_REPORT.md` for full details.

## SSR Architecture Guidelines

### HTML Template Requirements

The `client/index.html` file MUST contain the following markers for the server to inject content:

- `<!--app-head-->`: In the `<head>` tag. Used for Critical CSS, SEO meta tags, and title.
- `<!--app-html-->`: Inside `<div id="root">`. Used for the actual React rendering stream.

**Verification**: Run `npx tsx scripts/verify-ssr-template.ts` during build pipelines.

### Safe DOM Access

To prevent `ReferenceError: document is not defined` during Server-Side Rendering:

1.  **Never** access `window` or `document` at the top level of a module.
2.  **Always** wrap DOM access in `useEffect` or event handlers.
3.  **Utility Functions**: If a utility MUST access globals, guard it:

```typescript
if (typeof window === "undefined") {
  return DEFAULT_VALUE;
}
// Browser logic here
```
