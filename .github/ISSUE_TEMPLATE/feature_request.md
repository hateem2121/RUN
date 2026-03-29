---
name: Feature Request
about: Propose a new feature or enhancement for RUN Remix
title: 'feat: '
labels: enhancement
assignees: ''
---

## Problem Statement

What problem does this feature solve? Who is affected?

## Proposed Solution

Describe the feature you'd like. Be as specific as possible.

## B.L.A.S.T. Alignment

How does this feature align with the B.L.A.S.T. protocol?

- **Blueprint:** What schemas or SOPs need to be defined first?
- **Link:** What APIs or environment variables are required?
- **Architect:** Which A.N.T. layer (L1 SOPs / L2 Navigation / L3 Tools) does this touch?
- **Stylize:** Are there 5D design requirements (Skeleton, Skin, Palette, Voice, Soul)?
- **Trigger:** Does this require CI/CD changes?

## Tech Stack Constraints

Confirm this feature respects the hard constraints:

- [ ] Uses port 5002
- [ ] 3D: uses `@google/model-viewer` + `LazyUnifiedModelViewer` only (no `@react-three/fiber`)
- [ ] No `any` types in TypeScript
- [ ] Business logic in `server/services/`, not in routes
- [ ] Styling via Tailwind V4 `@utility` layer (no arbitrary values in JSX)

## Alternatives Considered

What other approaches did you consider?

## Additional Context

Mockups, references, related ADRs, or links.
