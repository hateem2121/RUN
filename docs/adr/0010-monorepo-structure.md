# ADR 0010: Monorepo over Polyrepo

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a repository structure that:

- Enables code sharing between frontend and backend
- Supports atomic changes across packages
- Provides consistent tooling and versioning
- Scales with team growth

## Decision

We chose a **Monorepo with npm workspaces + Turborepo** over multiple repositories.

## Structure

```
RUN-Remix/
├── client/   (@run-remix/client)
├── server/   (@run-remix/server)
├── shared/   (@run-remix/shared)
├── tests/    (Unit & Integration tests)
├── e2e/      (End-to-End tests)
├── docs/     (Documentation hub)
├── ops/      (Operational scripts)
├── scripts/  (Utility scripts)
├── k8s/      (Kubernetes manifests)
├── .github/  (CI/CD workflows)
└── .claude/  (Agent skills and tools)
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Monorepo** | Code sharing, atomic commits | Build complexity |
| **Polyrepo** | Team independence | Versioning overhead |
| **Git Submodules** | Independence + sharing | Complex workflows |

## Rationale

1. **Type Sharing**: `@run-remix/shared` provides types to both client and server
2. **Atomic Changes**: Single PR for cross-cutting changes
3. **Turborepo**: Intelligent caching and parallel builds
4. **npm Workspaces**: Native npm support without additional tools
5. **Consistent Tooling**: Same Biome, TypeScript, Vitest config

## Consequences

### Positive

- Schema changes automatically type-check across packages
- Single CI pipeline for all code
- Consistent code quality across packages
- Easy refactoring across boundaries

### Negative

- Larger repository size
- CI must be optimized for incremental builds
- Steeper learning curve for new developers
