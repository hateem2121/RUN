# Implementation Plan: Testing Coverage Overhaul - Phase 2 Completion

## Summary
Complete Phase 2 of the Testing Infrastructure Overhaul by increasing test coverage for ProductRepository (from ~20% to >70%) and AuthService (from ~62% to >70%). This plan focuses on adding comprehensive unit tests for untested methods and edge cases using Vitest and the existing mock patterns.

## Current State Analysis

### ProductRepository Test Coverage (~20%)
**File:** [`server/lib/db/repositories/__tests__/product-repository.test.ts`](server/lib/db/repositories/__tests__/product-repository.test.ts)

**Currently Tested Methods:**
- `createProduct` (basic tests)
- `updateProduct` (basic tests)
- `deleteProduct` (basic tests)
- `getProducts` (basic tests)
- `getProductCount` (basic tests)
- `getProductsSummary` (basic tests)
- `getProductBySlug` (basic tests)
- `getProductsByCategory` (basic tests)
- `searchProducts` (basic tests)
- `getHomepageFeaturedProducts` (basic tests)
- `getRelatedProducts` (basic tests)
- `get3DModelMetadata` (basic tests)

**Methods Needing Additional Tests:**
- `getProductsCursor` - Cursor-based pagination (no tests)
- `getProductsByCategoryCount` - Count by category with caching (no tests)
- `getProductsByTagCount` - Count by tag with caching (no tests)
- `searchProductsCount` - Search count with caching (no tests)
- `getProduct` - Single product by ID (no tests)
- `getProductByPath` - Complex method with context, LEFT JOINs, parallel batch fetching (no tests)
- `hardDeleteProduct` - Hard delete (no tests)
- `invalidateProductCount` - Cache invalidation (no tests)
- Cache hit/miss scenarios for all cached methods
- Edge cases for existing methods

### AuthService Test Coverage (~62%)
**File:** [`server/services/__tests__/auth-service.test.ts`](server/services/__tests__/auth-service.test.ts)

**Currently Tested:**
- `verifyAdminAccess` - cached status, storage check, mock admin handling
- `sessionSecurityMiddleware` - UA hash, mismatch rejection, session rotation
- Account lockout - failed attempts, lock check, reset
- `upsertUser` - Google profile upsert
- Middleware - `requireAdmin`, `isAuthenticated`
- Utilities - `hashUserAgent`

**Needs Additional Tests:**
- Edge cases for `verifyAdminAccess` - null user, missing claims
- Unauthenticated user scenarios
- Session expiration handling
- Error handling paths

---

## Files to Modify

| File | Changes |
|------|---------|
| `server/lib/db/repositories/__tests__/product-repository.test.ts` | Add ~400 lines of new tests |
| `server/services/__tests__/auth-service.test.ts` | Add ~100 lines of new tests |

---

## Approach

### Part 1: ProductRepository Tests (Priority: High)

#### 1.1 Cursor-Based Pagination Tests
```typescript
describe('getProductsCursor', () => {
  it('returns products with cursor for pagination')
  it('returns empty array when no more products')
  it('handles invalid cursor gracefully')
})
```

#### 1.2 Count Methods with Caching Tests
```typescript
describe('getProductsByCategoryCount', () => {
  it('returns count from database on cache miss')
  it('returns cached count on cache hit')
  it('caches result after database query')
  it('handles non-existent category')
})

describe('getProductsByTagCount', () => {
  it('returns count for valid tag')
  it('returns cached count on cache hit')
  it('handles non-existent tag')
})

describe('searchProductsCount', () => {
  it('returns count for search query')
  it('returns cached count on cache hit')
  it('handles empty search results')
})
```

#### 1.3 Single Product Retrieval Tests
```typescript
describe('getProduct', () => {
  it('returns product by ID')
  it('returns undefined for non-existent ID')
  it('excludes soft-deleted products')
})

describe('getProductByPath', () => {
  it('returns product with full context')
  it('returns null for non-existent path')
  it('handles cached 404 (negative cache)')
  it('returns cached product on cache hit')
  it('fetches related data in parallel')
})
```

#### 1.4 Mutation Tests
```typescript
describe('hardDeleteProduct', () => {
  it('permanently deletes product')
  it('throws error for non-existent product')
})

describe('invalidateProductCount', () => {
  it('clears product count cache')
})
```

#### 1.5 Cache Scenario Tests
```typescript
describe('Cache Scenarios', () => {
  it('getHomepageFeaturedProducts returns cached on hit')
  it('getProductCount returns cached on hit')
  it('cache invalidation works correctly')
})
```

### Part 2: AuthService Tests (Priority: Medium)

#### 2.1 Edge Cases for verifyAdminAccess
```typescript
describe('verifyAdminAccess edge cases', () => {
  it('returns false for null user')
  it('returns false for user without claims')
  it('handles storage errors gracefully')
})
```

#### 2.2 Unauthenticated Scenarios
```typescript
describe('Unauthenticated scenarios', () => {
  it('requireAdmin returns 401 for unauthenticated user')
  it('isAuthenticated returns 401 for missing user')
})
```

#### 2.3 Session Expiration
```typescript
describe('Session expiration', () => {
  it('handles expired session correctly')
  it('regenerates session after timeout')
})
```

---

## Mock Patterns to Use

### ProductRepository Mock Pattern
```typescript
// Chainable mock for Drizzle queries
const createMockChain = (resolvedValue: unknown) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue(resolvedValue),
  then: vi.fn().mockImplementation((resolve) => resolve(resolvedValue)),
});

// UnifiedCache mock
vi.mock('../../lib/cache/unified-cache', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### AuthService Mock Pattern
```typescript
// Existing pattern from test file
vi.mock('../../lib/storage-singleton', () => ({
  getStorage: vi.fn(),
}));

vi.mock('../../lib/cache/admin-cache', () => ({
  adminCacheManager: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));
```

---

## Test Execution Order

1. **ProductRepository - Count Methods** (Quick wins, simple caching logic)
2. **ProductRepository - Single Product Retrieval** (Moderate complexity)
3. **ProductRepository - Cursor Pagination** (Moderate complexity)
4. **ProductRepository - getProductByPath** (Complex, many dependencies)
5. **ProductRepository - Mutation Methods** (Simple, CRUD operations)
6. **ProductRepository - Cache Scenarios** (Integration-style tests)
7. **AuthService - Edge Cases** (Quick wins)
8. **AuthService - Session Handling** (Moderate complexity)

---

## Risks and Considerations

### Risk 1: Complex Mock Setup for getProductByPath
- **Issue:** `getProductByPath` uses circuit breaker, parallel queries, and multiple table joins
- **Mitigation:** Mock `dbCircuitBreaker.execute` to wrap the callback, use simplified mock data

### Risk 2: Cache Mock Interference Between Tests
- **Issue:** Cache state might persist between tests
- **Mitigation:** Use `beforeEach` to clear all mocks, reset cache state

### Risk 3: Drizzle ORM Query Chain Mocking
- **Issue:** Complex query chains are hard to mock accurately
- **Mitigation:** Use the existing `mockReturnThis()` pattern consistently

---

## Success Criteria

- [ ] `npm run test` passes with all new tests
- [ ] ProductRepository coverage reaches >70%
- [ ] AuthService coverage reaches >70%
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Biome linting passes (`npm run check:apply`)
- [ ] All tests follow existing patterns in the codebase
- [ ] No use of `any` type in test files
- [ ] All mocks properly typed

---

## Verification Commands

```bash
# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test server/lib/db/repositories/__tests__/product-repository.test.ts

# Type check
npm run typecheck

# Lint
npm run check:apply
```

---

## Rollback Plan

If tests cause issues:
1. New tests are additive only - no existing code modified
2. Simply delete the new test blocks to rollback
3. No database or configuration changes required

---

## Next Steps After Approval

1. Switch to Code mode
2. Implement ProductRepository tests in order of priority
3. Implement AuthService tests
4. Run coverage report to verify >70% achieved
5. Run full test suite to ensure no regressions
6. Submit for review
