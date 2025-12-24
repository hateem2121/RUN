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

## Developer Guidelines (Updated Late 2025)

### A. Performance Debugging

- **React Scan**: Installed as a dev tool. Use it to visualize re-renders in real-time.
- **WhyDidYouRender (WDYR)**:
  - Automatically enabled in `npm run dev`.
  - Check your **browser console** for component re-render logs.
  - Configuration: `client/src/wdyr.ts` (strictly excluded from production builds).

### B. Coding Standards

- **Logging**:
  - ❌ **DO NOT** use `console.log`.
  - ✅ **USE** `logger.info()` (server) or `debug` (client).
  - **Enforcement**: Commits with `console.log` will **FAIL** linting (Biome rule: `suspicious.noConsole`).
- **Testing**:
  - Use `tests/api.http` (VS Code REST Client) for quick local API validation before pushing.

### C. Infrastructure Notes

- **Rate Limiting**:
  - **Production**: Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
  - **Local/Fallback**: Automatically falls back to in-memory limiting if Redis credentials are missing.
  - **Logic**: Defined in `server/middleware/rateLimiter.ts`. Behavior is "Fail Open" (logs error but allows traffic) if Redis goes down.

### D. STRICT FOSS TOOLING (Mandatory)

This project adheres to a strict Free/Open Source Software policy.

- **API Testing**:
  - ✅ **USE**: **Bruno** (Open Source, Git-friendly).
  - ❌ **BANNED**: Thunder Client (Proprietary/Freemium).
- **Linting & Formatting**:
  - ✅ **USE**: **Biome** (VS Code extension: `biomejs.biome`).
    - _Note:_ Configured for v2.3.10+ schema with CSS linting enabled (`tailwindDirectives: true`).
  - ❌ **BANNED**: ESLint extension (due to configuration mismatch).
- **Security Scanning**:
  - **Trivy**: Used for filesystem scanning in CI.
  - **Local Command**: `trivy filesystem .`
- **Validation**:
  - **HTML**: `npx html-validate` is installed for template checks.
