---
name: verification-before-completion
description: Use this skill before marking any task as complete. Use this for ensuring all quality gates pass and the implementation meets production-ready standards.
---

# Verification Before Completion

## Goal

Ensure all code changes meet production-ready standards through systematic verification of build integrity, type safety, test coverage, code quality, and documentation before declaring a task complete.

## Instructions

### Phase 1: Build Verification

1. **TypeScript Compilation**
   ```bash
   npm run build
   ```
   - Must complete without errors
   - Check for type errors in all workspaces
   - Verify no implicit 'any' types

2. **Type Check Only**
   ```bash
   npm run typecheck
   ```
   - Faster than full build
   - Validates TypeScript across all workspaces
   - Run this for quick verification during development

### Phase 2: Test Verification

1. **Run All Tests**
   ```bash
   npm run test
   ```
   - All tests must pass
   - No skipped tests without justification
   - No flaky tests

2. **Check Coverage**
   ```bash
   npm run test:coverage
   ```
   - Services: 80%+ coverage
   - API routes: 85%+ coverage
   - Complex components: 80%+ coverage
   - Utilities: 80%+ coverage

3. **Run V2 Integration Tests**
   ```bash
   npm run test tests/v2
   ```
   - Stateful integration tests
   - Memory storage tests
   - RBAC verification tests

### Phase 3: Code Quality Verification

1. **Lint and Format**
   ```bash
   npm run check:apply
   ```
   - Biome auto-fixes issues
   - No remaining lint errors
   - Consistent code style

2. **Manual Code Review Checklist**
   - No 'any' types used
   - No prohibited imports (React Three Fiber, etc.)
   - Proper naming conventions followed
   - Files in correct directories
   - Named exports for components
   - Business logic in services, not routes

### Phase 4: Technical Integrity Verification

1. **Full Integrity Check**
   ```bash
   npm run verify:tech-integrity
   ```
   - **MANDATORY** pre-commit check
   - Validates all architectural invariants
   - Checks dependency versions
   - Verifies configuration consistency

2. **Check for Common Issues**
   - No hardcoded secrets or credentials
   - Environment variables properly configured
   - No console.log in production code (use logger)
   - Error boundaries in place for critical sections

### Phase 5: Documentation Verification

1. **JSDoc Comments**
   - All public functions documented
   - Complex logic explained
   - Examples provided for non-obvious usage

2. **README Updates**
   - New features documented
   - Usage examples added
   - Architecture changes noted

3. **Type Documentation**
   - Interfaces have descriptions
   - Complex types have examples
   - Enums have value explanations

## Verification Checklist

```markdown
## Build & Type Safety
- [ ] `npm run build` completes without errors
- [ ] `npm run typecheck` passes
- [ ] No TypeScript 'any' types used
- [ ] All imports resolve correctly
- [ ] No unused imports or variables

## Testing
- [ ] `npm run test` - all tests pass
- [ ] Coverage meets targets (80%+ for services)
- [ ] Integration tests pass (tests/v2)
- [ ] No skipped tests without justification
- [ ] Edge cases tested

## Code Quality
- [ ] `npm run check:apply` passes
- [ ] No Biome lint errors
- [ ] Follows naming conventions
- [ ] Proper file locations
- [ ] Named exports for components
- [ ] Business logic in services

## Technical Integrity
- [ ] `npm run verify:tech-integrity` passes
- [ ] No hardcoded secrets
- [ ] Environment variables configured
- [ ] Error boundaries in place
- [ ] No prohibited imports

## Documentation
- [ ] JSDoc comments on public functions
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] Type definitions documented

## Accessibility (if UI changes)
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus management correct
- [ ] Color contrast meets WCAG AA

## Performance (if applicable)
- [ ] No memory leaks
- [ ] Lazy loading for heavy components
- [ ] Images optimized
- [ ] No N+1 queries

## Security (if applicable)
- [ ] Input validation with Zod
- [ ] No SQL injection risks
- [ ] Authentication verified
- [ ] Authorization checked
```

## Examples

### Example 1: Feature Completion Verification

**Scenario:** Just completed implementing a new product search feature.

**Verification Steps:**

```bash
# Step 1: Build check
npm run build
# ✓ Build completed successfully

# Step 2: Type check
npm run typecheck
# ✓ No type errors

# Step 3: Run tests
npm run test
# ✓ All 47 tests passed

# Step 4: Check coverage
npm run test:coverage
# ✓ Services: 85% coverage
# ✓ Routes: 90% coverage
# ✓ Components: 78% coverage (acceptable for simple components)

# Step 5: Lint check
npm run check:apply
# ✓ No lint errors

# Step 6: Technical integrity
npm run verify:tech-integrity
# ✓ All checks passed
```

**Manual Verification:**
- [ ] No 'any' types in new code
- [ ] Search component uses named export
- [ ] Search logic in `searchService.ts`, not in route
- [ ] Zod validation for search input
- [ ] JSDoc comments on `searchProducts()` function
- [ ] README updated with search feature docs

**Result:** Task verified and ready for completion.

### Example 2: Bug Fix Verification

**Scenario:** Fixed a null pointer exception in order processing.

**Verification Steps:**

```bash
# Step 1: Build check
npm run build
# ✓ Build completed

# Step 2: Run related tests
npm run test server/services/orderService.test.ts
# ✓ All order tests pass

# Step 3: Run full test suite
npm run test
# ✓ All tests pass

# Step 4: Check coverage
npm run test:coverage
# ✓ Order service coverage: 88%

# Step 5: Technical integrity
npm run verify:tech-integrity
# ✓ All checks passed
```

**Manual Verification:**
- [ ] Regression test added for null case
- [ ] Root cause documented in code comment
- [ ] No other null pointer risks identified
- [ ] Error handling improved

**Result:** Bug fix verified and ready for completion.

### Example 3: Refactoring Verification

**Scenario:** Refactored authentication middleware for better error handling.

**Verification Steps:**

```bash
# Step 1: Build check
npm run build
# ✓ Build completed

# Step 2: Run auth tests
npm run test server/middleware/auth.test.ts
# ✓ All auth tests pass

# Step 3: Run integration tests
npm run test tests/v2
# ✓ All integration tests pass

# Step 4: Full test suite
npm run test
# ✓ All tests pass

# Step 5: Technical integrity
npm run verify:tech-integrity
# ✓ All checks passed
```

**Manual Verification:**
- [ ] No behavior changes (refactor only)
- [ ] Error messages preserved
- [ ] All edge cases still handled
- [ ] Code is more readable
- [ ] No new dependencies added

**Result:** Refactoring verified and ready for completion.

## Quick Verification Commands

```bash
# Full verification pipeline
npm run build && npm run test && npm run check:apply && npm run verify:tech-integrity

# Quick check (during development)
npm run typecheck && npm run test

# Pre-commit verification
npm run verify:tech-integrity
```

## Common Verification Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Build fails | TypeScript errors | Fix type errors, check imports |
| Tests fail | Broken functionality | Debug and fix the failing tests |
| Coverage low | Missing tests | Add tests for uncovered code |
| Lint errors | Code style issues | Run `npm run check:apply` to auto-fix |
| Integrity fails | Architecture violation | Check error message and fix accordingly |
| Import errors | Wrong paths or missing deps | Check import paths and package.json |

## Constraints

- **NEVER** skip `npm run verify:tech-integrity`
- **NEVER** mark complete with failing tests
- **NEVER** mark complete with TypeScript errors
- **NEVER** skip coverage check for services
- **ALWAYS** run full verification pipeline
- **ALWAYS** check for 'any' types manually
- **ALWAYS** verify documentation is updated

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Verification is the final Tool Atomic (T) step
- **Progressive Disclosure**: Core checklist here; detailed patterns in `references/`
- **Quality Gates**: Ensures production-ready code before completion

## Related Skills

- `test-driven-development` - Write tests first
- `systematic-debugging` - Debug failing verifications
- `writing-plans` - Plan before implementing
