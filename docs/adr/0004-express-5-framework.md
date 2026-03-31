# ADR 0004: Express 5 over Fastify/Hono

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a Node.js web framework that:

- Provides robust middleware ecosystem
- Supports async/await natively
- Has long-term stability and community support
- Integrates well with React Router SSR

## Decision

We chose **Express 5.1** over Fastify or Hono.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Express 5** | Massive ecosystem, stable, familiar | Slower than alternatives |
| **Fastify** | High performance, schema validation | Different middleware model |
| **Hono** | Ultra-fast, edge-ready | Newer, smaller ecosystem |
| **Koa** | Clean async model | Smaller middleware ecosystem |

## Rationale

1. **React Router Integration**: `@react-router/express` provides first-class Express support
2. **Middleware Ecosystem**: Helmet, cors, compression all work out of the box
3. **Express 5 Features**: Native async error handling, improved routing
4. **Team Familiarity**: Express is the most widely known Node.js framework
5. **Stability**: 10+ years of production use across industry

## Consequences

### Positive

- Vast middleware ecosystem
- Easy to find developers with Express experience
- Excellent documentation and Stack Overflow coverage
- React Router SSR works seamlessly

### Negative

- Not the fastest option (though fast enough for our needs)
- Some legacy patterns in older middleware
