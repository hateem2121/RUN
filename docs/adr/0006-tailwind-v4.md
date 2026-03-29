# ADR 0006: Tailwind CSS v4 over CSS Modules

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a CSS solution that:
- Provides consistent design system enforcement
- Enables rapid UI development
- Supports modern CSS features
- Works well with component-based architecture

## Decision

We chose **Tailwind CSS v4** over CSS Modules or styled-components.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Tailwind v4** | Design tokens, fast iteration | HTML can get verbose |
| **CSS Modules** | Scoped styles, standard CSS | Manual design system |
| **styled-components** | CSS-in-JS, dynamic | Runtime overhead |
| **Vanilla Extract** | Zero-runtime, type-safe | Steeper learning curve |

## Rationale

1. **Tailwind v4 Features**: Native CSS variables, `@theme` directive, improved performance
2. **Design Tokens**: 116 tokens defined in `index.css` enforce consistency
3. **Utility-First**: Rapid prototyping without context switching
4. **CVA Integration**: `class-variance-authority` for component variants
5. **No Runtime**: Pure CSS output, zero JavaScript overhead

## Consequences

### Positive
- 10/10 CSS architecture score achieved
- Consistent design language across application
- Fast development velocity
- Semantic color tokens eliminate raw color usage

### Negative
- Learning curve for utility-first approach
- HTML can become verbose (mitigated by `cn()` helper)
