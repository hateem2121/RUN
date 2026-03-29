---
name: react-19-optimistic-ui
description: |
  React 19 high-performance patterns. Triggers:
  - "form mutation", "optimistic ui", "useOptimistic", "useActionState"
  - "raw ref prop", "ref prop", "forwardRef replacement"
---

# React 19 Optimistic UI & Modern Patterns

## Goal
Implement instant-feedback user interfaces and modern React 19 patterns to mask edge latency (e.g., Neon cold starts) and follow 2026 architectural standards.

## Instructions

### 1. Optimistic Mutations
Always pair `useOptimistic` with `useActionState` (or a server action) for any data-modifying forms.
1. Define the optimistic state.
2. Update state immediately on form submission.
3. Allow the server response to reconcile the UI.

### 2. Form Actions
Use native `<form action={fn}>` instead of `onSubmit` event handlers. This enables easier integration with Server Actions and automated pending states.

### 3. Raw Ref Props
React 19 permits `ref` as a standard prop. 
- **NEVER** use `forwardRef`.
- Directly pass `ref` to the underlying DOM element or child component.

## Constraints
- **NO** manual `useEffect` synchronization for state reconciliation.
- **NO** unnecessary memoization (React Compiler handles this).
- **NO** `any` types in hook definitions.
