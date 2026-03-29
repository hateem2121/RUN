# ADR 0002: React Router 7 over Next.js

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

---
> **Modernization Note (2026-02-03)**: Terminology standardized to **React Router 7** to align with canonical stack definitions.

## Context

We needed a modern React framework for building a B2B e-commerce platform with:
- Server-side rendering (SSR) for SEO and performance
- Type-safe routing
- Excellent developer experience
- Fine-grained control over server/client boundary

## Decision

We chose **React 19 with React Router 7** (formerly Remix) over Next.js.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Next.js 15** | Large ecosystem, Vercel hosting | App Router complexity, vendor lock-in |
| **Remix/React Router 7** | Web standards, Express integration, flexibility | Smaller ecosystem |
| **Astro** | Great for content sites | Not ideal for highly interactive apps |

## Rationale

1. **Express Integration**: React Router 7 works seamlessly with Express 5, allowing us to use familiar Node.js patterns
2. **Web Standards**: Embraces `fetch`, `Request/Response`, and progressive enhancement
3. **SSR Control**: Fine-grained control over streaming SSR without framework magic
4. **No Vendor Lock-in**: Deploys anywhere Node.js runs (Cloud Run, AWS, etc.)
5. **Bleeding Edge**: React 19 with Server Components support

## Consequences

### Positive
- Full control over server infrastructure
- Standard Express middleware compatibility
- Excellent TypeScript integration
- React 19 concurrent features available

### Negative
- Smaller community than Next.js
- Fewer tutorials and examples
- Must manage SSR configuration ourselves
