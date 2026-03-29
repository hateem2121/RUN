---
name: development-workflow
description: |
  Development workflow, testing standards (Vitest), and uncertainty protocol.
  Triggers: "how to work", "testing requirements", "uncertainty protocol", "deployment workflow"
---

# Development Workflow & Testing

## Workflow Patterns
- **Simple Tasks (<100 lines)**: Direct implementation → Verify TypeScript → Run Tests → Format.
- **Complex Tasks (>100 lines)**: Create `implementation_plan.md` → Wait for approval → Execute → Verify.

## Testing Standards (Vitest)
- **Priority**: Test services (business logic), complex utilities, and data transformations.
- **Coverage Goal**: Aim for 80%+ on services and utilities.
- **Patterns**: Use Vitest for service tests, hook tests, and critical component tests.

## Uncertainty Protocol (CRITICAL)
- If unsure about file locations, breaking changes, or business logic: **ASK**.
- Do not implement based on assumptions.

## Code Quality Checklist
Before completion, verify:
- [ ] TypeScript: No errors (`npm run build`).
- [ ] Tests: Pass with >80% coverage on services.
- [ ] Linting: Biome passes.
- [ ] Accessibility: Keyboard support, ARIA labels.
- [ ] 3D: Using `@google/model-viewer`.
- [ ] Styling: CVA + cn() (NO arbitrary values).
