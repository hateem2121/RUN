# ADR 0001: ADR Template

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We need a consistent format for documenting architectural decisions to ensure knowledge is preserved and decisions can be revisited with full context.

## Decision

We will use the MADR (Markdown Any Decision Records) format for all ADRs.

## Consequences

### Positive
- Consistent documentation format
- Easy to read and maintain
- Git-trackable decision history

### Negative
- Overhead of creating records for each decision

## Template

```markdown
# ADR [NUMBER]: [TITLE]

**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Date**: YYYY-MM-DD  
**Deciders**: [Team/People]

## Context

[Describe the issue/requirement and the forces at play]

## Decision

[State the decision and rationale]

## Alternatives Considered

[List alternatives that were evaluated]

## Consequences

### Positive
[Benefits of the decision]

### Negative
[Drawbacks or risks]
```
