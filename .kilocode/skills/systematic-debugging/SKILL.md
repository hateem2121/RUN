---
name: systematic-debugging
description: Use this skill when encountering errors, unexpected behavior, or failing tests. Use this for methodical root cause analysis and resolution following a structured debugging approach.
---

# Systematic Debugging

## Goal

Diagnose and resolve software issues efficiently using a structured, reproducible methodology that identifies root causes rather than treating symptoms.

## Instructions

### Phase 1: Observe (Gather Information)

1. **Reproduce the Issue**
   - Document exact steps to reproduce
   - Note expected vs actual behavior
   - Identify if issue is consistent or intermittent
   - Check if issue occurs in different environments

2. **Collect Error Data**
   - Read error messages carefully
   - Check browser console for frontend errors
   - Check server logs for backend errors
   - Note stack traces and line numbers

3. **Gather Context**
   - What changed recently? (git log, deployments)
   - Which files/components are involved?
   - What are the dependencies?
   - Are there related issues in the codebase?

### Phase 2: Hypothesize (Form Theories)

1. **Generate Multiple Hypotheses**
   - List 2-5 possible causes
   - Rank by probability (most likely first)
   - Consider: data issues, logic errors, timing/race conditions, configuration, dependencies

2. **Design Tests for Each Hypothesis**
   - What would prove/disprove each theory?
   - What data or logs would confirm?
   - Can you isolate the component?

### Phase 3: Isolate (Narrow Down)

1. **Binary Search Approach**
   - Comment out half the code
   - If error persists, it's in the remaining half
   - If error disappears, it's in the commented half
   - Repeat until isolated

2. **Component Isolation**
   - Test the component in isolation
   - Use minimal reproduction case
   - Remove dependencies one by one

3. **Data Isolation**
   - Test with known good data
   - Test with edge cases (empty, null, max values)
   - Check database state

### Phase 4: Fix (Implement Solution)

1. **Verify Root Cause**
   - Confirm hypothesis with evidence
   - Document the root cause
   - Ensure fix addresses root cause, not symptom

2. **Implement Minimal Fix**
   - Make smallest change that fixes the issue
   - Don't refactor while fixing
   - Add comments explaining the fix

3. **Add Regression Test**
   - Write a test that would have caught the bug
   - Test should fail before fix, pass after
   - Include edge cases

### Phase 5: Verify (Confirm Resolution)

1. **Test the Fix**
   - Run the reproduction steps
   - Verify expected behavior
   - Run related tests

2. **Run Full Test Suite**
   - Execute: `npm run test`
   - Ensure no regressions
   - Check coverage

3. **Final Verification**
   - Run: `npm run typecheck`
   - Run: `npm run check:apply`
   - Run: `npm run verify:tech-integrity`

## Examples

### Example 1: API Error Debugging

**Observation:**
```
Error: GET /api/products/123 returned 500 Internal Server Error
Stack trace points to productService.ts:45
```

**Hypotheses:**
1. Product with ID 123 doesn't exist (null reference)
2. Database connection issue
3. Invalid data format in database
4. Missing required field

**Isolation:**
```typescript
// Add logging to productService.ts
export async function getProduct(id: string): Promise<Product> {
  console.log('Getting product with ID:', id);
  const product = await db.products.findById(id);
  console.log('Product found:', product);
  
  if (!product) {
    throw new ProductNotFoundError(id);
  }
  
  return product;
}
```

**Root Cause:**
Product ID 123 exists but has `null` for a required field `price`, causing a validation error downstream.

**Fix:**
```typescript
// Add null check and default
export async function getProduct(id: string): Promise<Product> {
  const product = await db.products.findById(id);
  
  if (!product) {
    throw new ProductNotFoundError(id);
  }
  
  // Fix: Ensure price has a valid value
  if (product.price === null || product.price === undefined) {
    console.warn(`Product ${id} has null price, using default`);
    product.price = 0;
  }
  
  return product;
}
```

**Regression Test:**
```typescript
it('should handle product with null price', async () => {
  // Create product with null price
  const product = await createProduct({ name: 'Test', price: null });
  
  // Should not throw
  const result = await getProduct(product.id);
  expect(result.price).toBe(0);
});
```

### Example 2: React Component Bug

**Observation:**
```
ProductCard component doesn't update when product prop changes
Expected: Card shows new price after update
Actual: Card shows old price
```

**Hypotheses:**
1. React isn't re-rendering (memo issue)
2. State is stale (closure issue)
3. Prop mutation (reference equality)
4. Parent component issue

**Isolation:**
```typescript
// Add debug logging
export function ProductCard({ product }: ProductCardProps) {
  console.log('ProductCard render:', product.id, product.price);
  
  const [localPrice, setLocalPrice] = useState(product.price);
  
  useEffect(() => {
    console.log('product.price changed:', product.price);
    setLocalPrice(product.price);
  }, [product.price]);
  
  return <div>{localPrice}</div>;
}
```

**Root Cause:**
The component was using local state initialized from props, but the useEffect dependency was missing, so it wasn't updating when props changed.

**Fix:**
```typescript
export function ProductCard({ product }: ProductCardProps) {
  // Fix: Use derived value instead of state
  const displayPrice = product.price;
  
  return <div>{displayPrice}</div>;
}
```

**Regression Test:**
```typescript
it('should update when product prop changes', () => {
  const { rerender } = render(<ProductCard product={{ id: '1', price: 10 }} />);
  expect(screen.getByText('$10')).toBeInTheDocument();
  
  rerender(<ProductCard product={{ id: '1', price: 20 }} />);
  expect(screen.getByText('$20')).toBeInTheDocument();
});
```

### Example 3: Test Failure Debugging

**Observation:**
```
FAIL server/services/orderService.test.ts
✗ should calculate total with tax
Expected: 110
Received: 100
```

**Hypotheses:**
1. Tax calculation not being applied
2. Tax rate is 0
3. Rounding issue
4. Mock not configured correctly

**Isolation:**
```typescript
it('should calculate total with tax', async () => {
  // Add debug output
  const order = { subtotal: 100, taxRate: 0.1 };
  console.log('Input:', order);
  
  const result = await calculateTotal(order);
  console.log('Result:', result);
  console.log('Tax applied:', result - order.subtotal);
  
  expect(result).toBe(110);
});
```

**Root Cause:**
The test was using a mock that returned a fixed tax rate of 0, overriding the test data.

**Fix:**
```typescript
// Fix mock configuration
vi.mock('@/services/taxService', () => ({
  getTaxRate: vi.fn().mockReturnValue(0.1), // Was: mockReturnValue(0)
}));
```

## Debugging Commands

```bash
# Check TypeScript errors
npm run typecheck

# Run specific test with verbose output
npm run test -- --reporter=verbose path/to/test.test.ts

# Check for linting issues
npm run check:apply

# View server logs
tail -f server/logs/error.log

# Database queries
psql $DATABASE_URL -c "SELECT * FROM products WHERE id = '123';"

# Check environment variables
node -e "console.log(process.env.DATABASE_URL)"
```

## Constraints

- **NEVER** fix symptoms without understanding root cause
- **NEVER** skip adding regression tests
- **NEVER** make multiple changes at once (one hypothesis at a time)
- **NEVER** ignore intermittent issues (they indicate real problems)
- **ALWAYS** document the root cause in comments or docs
- **ALWAYS** verify fix doesn't break other functionality
- **ALWAYS** run full test suite after fix

## Debugging Checklist

```markdown
## Phase 1: Observe
- [ ] Issue reproduced consistently
- [ ] Error messages collected
- [ ] Stack traces documented
- [ ] Context gathered (recent changes, dependencies)

## Phase 2: Hypothesize
- [ ] Multiple hypotheses generated
- [ ] Hypotheses ranked by probability
- [ ] Tests designed for each hypothesis

## Phase 3: Isolate
- [ ] Component isolated
- [ ] Minimal reproduction created
- [ ] Root cause identified

## Phase 4: Fix
- [ ] Root cause verified
- [ ] Minimal fix implemented
- [ ] Regression test added

## Phase 5: Verify
- [ ] Fix tested with reproduction steps
- [ ] Full test suite passes
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tech integrity verified
```

## Common Bug Patterns

| Pattern | Symptoms | Solution |
|---------|----------|----------|
| Null/Undefined | TypeError: Cannot read property | Add null checks, use optional chaining |
| Race Condition | Intermittent failures | Add proper async/await, locks |
| Stale Closure | Old values in callbacks | Use refs or update dependencies |
| Memory Leak | Increasing memory usage | Clean up event listeners, intervals |
| Off-by-One | Index errors | Review loop boundaries |
| Type Coercion | Unexpected comparisons | Use strict equality (===) |
| State Mutation | Unexpected state changes | Use immutable patterns |
| Dependency Issue | Missing or wrong versions | Check package.json, lock file |

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Debugging follows Self-anneal (S) - document errors and update invariants
- **Progressive Disclosure**: Core workflow here; advanced patterns in `references/`
- **Quality Gates**: Verification ensures fix is complete and tested

## Related Skills

- `test-driven-development` - Write tests first to prevent bugs
- `verification-before-completion` - Final quality gates
- `error-handling` - Implement proper error handling patterns
