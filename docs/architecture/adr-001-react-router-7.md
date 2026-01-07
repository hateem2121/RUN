# ADR-001: Adoption of React Router 7

## Status
Accepted

## Date
2026-01-07

## Context
The project required a modern, capable routing solution that supports both Client-Side Routing (SPA) and Server-Side Rendering (SSR) capabilities. We evaluated React Router 6, TanStack Router, and Remix (v2). React Router 7 was released as the convergence of Remix and React Router, offering the best of both worlds:
- Type-safe routing
- Nested layouts
- Data loading APIs (loaders/actions)
- SSR support out of the box

## Decision
We chose **React Router 7** as the core framework for the client application.

## Consequences
### Positive
- Unified API for data fetching and routing.
- Future-proof alignment with the Remix team's roadmap.
- Excellent TypeScript integration for route parameters.
- Simplified migration path if we move to a full Remix app structure later.

### Negative
- Newer ecosystem means fewer community examples compared to Next.js.
- Beta status during initial development meant some API flux (now stable).

## Compliance
- All new routes must be defined in `client/app/routes.ts`.
- Data fetching should prefer `loader` patterns over `useEffect` where possible.
