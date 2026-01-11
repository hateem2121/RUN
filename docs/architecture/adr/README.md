# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for significant technical decisions in the RUN Apparel platform.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](./adr-001-react-router-7.md) | Migration to React Router 7 | Accepted | Jan 2026 |

## ADR Template

Use the [template](./template.md) when creating new ADRs.

## Creating a New ADR

1. Copy `template.md` to `adr-XXX-title.md` (where XXX is the next number)
2. Fill in all sections
3. Submit PR with the ADR
4. Update this index after approval

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Decision made and approved |
| **Deprecated** | No longer relevant, superseded |
| **Superseded** | Replaced by another ADR |

## References

- [Michael Nygard's ADR Article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
