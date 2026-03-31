# ADR 0009: Biome over ESLint + Prettier

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed code quality tooling that:

- Provides fast linting and formatting
- Has minimal configuration
- Supports TypeScript natively
- Reduces dependency count

## Decision

We chose **Biome** over ESLint + Prettier combination.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Biome** | Fast, unified, minimal config | Newer ecosystem |
| **ESLint + Prettier** | Mature, extensive plugins | Slow, config complexity |
| **dprint** | Fast formatting | Formatting only |
| **Rome (legacy)** | Unified toolchain | Deprecated |

## Rationale

1. **Performance**: 10-100x faster than ESLint (written in Rust)
2. **Unified Tool**: Both linting and formatting in one
3. **Zero Config**: Sensible defaults out of the box
4. **TypeScript Native**: First-class TypeScript support
5. **Reduced Dependencies**: Single tool vs multiple packages

## Consequences

### Positive

- CI runs complete in seconds, not minutes
- Single `biome.json` configuration file
- Consistent formatting enforcement
- Fewer dependency vulnerabilities

### Negative

- Fewer lint rules than ESLint ecosystem
- Some ESLint plugins not available (accepted trade-off)
- Team needs to learn new tool
