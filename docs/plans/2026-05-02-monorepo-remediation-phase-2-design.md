# Design: Monorepo Remediation — Stability & Standards Phase (Phase 2)

**Date:** 2026-05-02
**Status:** Approved
**Owner:** Antigravity (Agentic Engineering Team)

## 1. Overview

Following the successful audit and initial remediation of Phase 1, Phase 2 focuses on enforcing strict accessibility standards, optimizing build infrastructure, and establishing the "North Star" for React 19 patterns in the Admin dashboard.

## 2. Goals

- **Zero Lint Errors**: Resolve all 215 accessibility warnings enforced by Biome.
- **Build Speed**: Configure Turborepo caching to minimize redundant task execution.
- **Dead Code Elimination**: Reduce project surface area by safely removing unused files.
- **React 19 Standards**: Implement modern state/optimistic UI patterns in a pilot Admin component.

## 3. Architecture & Components

### 3.1 Turborepo Caching
We will update `turbo.json` to ensure that all tasks (`build`, `lint`, `typecheck`, `test`) have clearly defined `inputs` and `outputs`. This allows Turborepo to skip work that hasn't changed.

### 3.2 A11Y Remediation Strategy
To maintain reviewability and safety, A11Y fixes will be grouped by rule:
- **Rule: `useButtonType`**: Automated addition of `type="button"` to non-submit buttons.
- **Rule: `useKeydownHandler`**: Manual/Semi-automated addition of keyboard listeners for clickable non-semantic elements.
- **Rule: `useAltText`/`useAriaLabel`**: Strategic labeling of interactive icons and images.

### 3.3 React 19 Admin Pilot (`HeroManagement.tsx`)
We will refactor the Manufacturing Hero management component to use:
- `useActionState`: For managing form submission state and server responses.
- `useOptimistic`: For immediate UI updates during background saves.
- Raw `ref` props instead of `forwardRef`.

## 4. Verification Plan

### Automated Tests
- `npm run verify:tech-integrity`: Must pass.
- `npm run lint`: Target is 0 errors.
- `npm run build`: Must pass across all workspaces.
- `npm run test`: All unit/integration tests must pass.

### Manual Verification
- Verify that keyboard navigation (Tab + Enter/Space) works on remediated components.
- Verify that the Admin Hero management feels "instant" due to optimistic updates.
