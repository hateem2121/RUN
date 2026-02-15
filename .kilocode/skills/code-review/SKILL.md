---
name: code-review
description: Use this skill when reviewing code changes, pull requests, or performing code quality audits. Use this for systematic code review following RUN Remix standards.
---

# Code Review

## Goal

Perform systematic, thorough code reviews that ensure code quality, maintainability, security, and adherence to RUN Remix standards while providing constructive feedback.

## Instructions

### Phase 1: Pre-Review Setup

1. **Understand the Context**
   - What is being changed?
   - Why is this change needed?
   - Who is the author?
   - What files are affected?

2. **Gather Context**
   - Read the PR description or commit message
   - Check linked issues or tickets
   - Review any related documentation
   - Note the scope of changes

3. **Identify Review Focus**
   - New feature? → Focus on architecture, patterns
   - Bug fix? → Focus on root cause, edge cases
   - Refactor? → Focus on behavior preservation
   - Performance? → Focus on benchmarks, metrics

### Phase 2: Code Quality Review

1. **TypeScript Standards**
   ```markdown
   ## TypeScript Checklist
   - [ ] No `any` types used
   - [ ] Explicit return types on functions
   - [ ] Proper interface/type definitions
   - [ ] No type assertions without validation
   - [ ] Generics used appropriately
   - [ ] Null/undefined handled correctly
   ```

2. **React Component Review**
   ```markdown
   ## React Component Checklist
   - [ ] Functional component (not class)
   - [ ] Named export (not default)
   - [ ] No forwardRef (use ref prop directly)
   - [ ] Props interface defined
   - [ ] Proper hook usage
   - [ ] Loading/error states handled
   - [ ] Accessibility attributes present
   ```

3. **Express Backend Review**
   ```markdown
   ## Express Backend Checklist
   - [ ] Route is thin (delegates to service)
   - [ ] No try/catch in async handlers
   - [ ] Input validation with Zod
   - [ ] Proper error classes used
   - [ ] Service contains business logic
   - [ ] Database queries parameterized
   ```

4. **Styling Review**
   ```markdown
   ## Styling Checklist
   - [ ] CVA used for variants
   - [ ] cn() for conditional classes
   - [ ] No arbitrary Tailwind values
   - [ ] Custom CSS in @layer utilities
   - [ ] Semantic color tokens used
   - [ ] Responsive classes present
   ```

### Phase 3: Architecture Review

1. **File Organization**
   - Is the file in the correct directory?
   - Does the filename follow conventions?
   - Are related files grouped properly?

2. **Dependency Analysis**
   - Are imports using workspace aliases?
   - Any circular dependencies?
   - Are dependencies appropriate?
   - Any new packages needed?

3. **Pattern Consistency**
   - Does it follow existing patterns?
   - Is it consistent with codebase style?
   - Any new patterns introduced?
   - Should this be a shared utility?

### Phase 4: Security Review

1. **Input Validation**
   - All external inputs validated with Zod?
   - File uploads handled securely?
   - User input sanitized?

2. **Authentication/Authorization**
   - Routes properly protected?
   - RBAC implemented correctly?
   - Session handling secure?

3. **Data Protection**
   - Sensitive data encrypted?
   - No secrets in code?
   - PII handled properly?

4. **Common Vulnerabilities**
   - SQL injection prevented?
   - XSS prevented?
   - CSRF tokens used?
   - Rate limiting implemented?

### Phase 5: Performance Review

1. **Frontend Performance**
   - Components lazy loaded?
   - Images optimized?
   - Expensive computations memoized?
   - Bundle size impact considered?

2. **Backend Performance**
   - Database queries optimized?
   - N+1 queries avoided?
   - Caching implemented?
   - Pagination used for lists?

3. **3D Content**
   - Using @google/model-viewer?
   - Models compressed (<2MB)?
   - Error boundary present?
   - Lazy loading used?

### Phase 6: Testing Review

1. **Test Coverage**
   - Tests written for new code?
   - Coverage meets 80% target?
   - Edge cases tested?
   - Error paths tested?

2. **Test Quality**
   - Tests are meaningful?
   - Assertions are specific?
   - Mocks used appropriately?
   - Tests are maintainable?

### Phase 7: Documentation Review

1. **Code Documentation**
   - JSDoc on public functions?
   - Complex logic explained?
   - TODO comments appropriate?

2. **External Documentation**
   - README updated if needed?
   - API documentation updated?
   - Type definitions exported?

### Phase 8: Feedback Delivery

1. **Structure Your Feedback**
   ```markdown
   ## Summary
   [Overall impression of the changes]

   ## Strengths
   - [What's done well]
   - [Good patterns used]

   ## Suggestions
   - [Non-blocking improvements]
   - [Optional optimizations]

   ## Required Changes
   - [ ] [Issue 1 - with explanation]
   - [ ] [Issue 2 - with explanation]

   ## Questions
   - [Clarifying questions]
   ```

2. **Be Constructive**
   - Explain WHY something should change
   - Provide code examples for suggestions
   - Reference documentation or patterns
   - Acknowledge good work

3. **Prioritize Feedback**
   - 🔴 **Blocking**: Must fix before merge
   - 🟡 **Important**: Should fix, but not blocking
   - 🟢 **Suggestion**: Nice to have, optional

## Examples

### Example 1: Component Review

**Code Under Review:**
```typescript
// ❌ Issues found
export default function ProductList(props: any) {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  });
  
  return (
    <div className="grid grid-cols-3 gap-[23px]">
      {products.map(p => (
        <div onClick={() => select(p.id)}>
          <img src={p.image} />
          <h3>{p.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

**Review Feedback:**
```markdown
## Summary
The component works but has several issues that need addressing before merge.

## Required Changes

### 🔴 TypeScript Issues
- [ ] Replace `any` with proper interface:
  ```typescript
  interface ProductListProps {
    onSelect?: (productId: string) => void;
    className?: string;
  }
  ```

### 🔴 React Issues
- [ ] Use named export instead of default:
  ```typescript
  export function ProductList({ onSelect, className }: ProductListProps) {
  ```
- [ ] Add dependency array to useEffect to prevent infinite loop:
  ```typescript
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []); // Empty array for mount-only
  ```

### 🔴 Styling Issues
- [ ] Replace arbitrary value `gap-[23px]` with standard spacing:
  ```typescript
  <div className="grid grid-cols-3 gap-6"> // gap-6 = 24px
  ```

### 🔴 Accessibility Issues
- [ ] Add keyboard support and ARIA attributes:
  ```typescript
  <button
    onClick={() => onSelect?.(p.id)}
    aria-label={`Select ${p.name}`}
    className="focus:ring-2 focus:ring-primary"
  >
  ```
- [ ] Add alt text to images:
  ```typescript
  <img src={p.image} alt={p.name} loading="lazy" />
  ```

## Suggestions
🟢 Consider using TanStack Query for data fetching instead of raw useEffect
🟢 Add loading and error states
```

### Example 2: Service Layer Review

**Code Under Review:**
```typescript
// server/services/orderService.ts
export async function createOrder(data: any) {
  const order = await db.orders.create({
    ...data,
    createdAt: new Date(),
  });
  
  return order;
}
```

**Review Feedback:**
```markdown
## Summary
Service needs input validation and error handling.

## Required Changes

### 🔴 Input Validation
- [ ] Add Zod schema for validation:
  ```typescript
  import { z } from 'zod';
  
  export const createOrderSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(10000),
    customization: z.object({
      color: z.string().max(50),
      size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    }).optional(),
  });
  
  export type CreateOrderInput = z.infer<typeof createOrderSchema>;
  ```

### 🔴 Business Logic
- [ ] Add business logic to service:
  ```typescript
  export async function createOrder(input: CreateOrderInput) {
    // Validate
    const validated = createOrderSchema.parse(input);
    
    // Check product exists
    const product = await db.products.findById(validated.productId);
    if (!product) {
      throw new ProductNotFoundError(validated.productId);
    }
    
    // Calculate total
    const total = product.price * validated.quantity;
    
    // Create order
    const order = await db.orders.create({
      ...validated,
      total,
      status: 'pending',
      createdAt: new Date(),
    });
    
    return order;
  }
  ```

## Suggestions
🟢 Add inventory check before creating order
🟢 Send order confirmation email after creation
🟢 Add audit logging for order creation
```

### Example 3: Pull Request Review

**PR: Add Product Search Feature**

**Review Feedback:**
```markdown
## Summary
Great implementation of the search feature! The architecture follows our patterns well. A few required changes around validation and error handling.

## Strengths
- ✅ Service layer properly separates business logic
- ✅ Routes are thin and delegate to service
- ✅ Good use of TanStack Query for caching
- ✅ Proper TypeScript types throughout

## Required Changes

### 🔴 Validation
- [ ] Add Zod schema for search input validation in `shared/validators/search.ts`
- [ ] Validate pagination parameters (max page size)

### 🔴 Error Handling
- [ ] Add error boundary around search component
- [ ] Handle empty results with proper UI state

### 🔴 Testing
- [ ] Add unit tests for `searchService.searchProducts`
- [ ] Add integration test for search API endpoint

## Suggestions
🟡 Consider adding debouncing to search input (300ms)
🟡 Add search history for better UX
🟢 Consider adding search filters as URL params for shareability

## Questions
- Should search results be cached? If so, what TTL?
- Do we need analytics on search queries?

## Files Reviewed
- `server/services/searchService.ts` - Good structure
- `server/routes/search.ts` - Needs validation
- `client/app/components/products/ProductSearch.tsx` - Needs error boundary
- `shared/types/search.ts` - Good types

## Verdict
Request changes - validation and testing required before merge.
```

## Review Checklist

```markdown
## Pre-Review
- [ ] Understand the change context
- [ ] Check linked issues
- [ ] Identify review focus

## Code Quality
- [ ] TypeScript standards met
- [ ] React patterns correct
- [ ] Express patterns correct
- [ ] Styling follows standards

## Architecture
- [ ] Files in correct locations
- [ ] Dependencies appropriate
- [ ] Patterns consistent

## Security
- [ ] Input validation present
- [ ] Auth/authz correct
- [ ] No vulnerabilities introduced

## Performance
- [ ] No performance regressions
- [ ] Optimizations appropriate
- [ ] 3D content correct

## Testing
- [ ] Tests written
- [ ] Coverage adequate
- [ ] Tests meaningful

## Documentation
- [ ] Code documented
- [ ] External docs updated

## Feedback
- [ ] Constructive tone
- [ ] Clear explanations
- [ ] Prioritized issues
```

## Constraints

- **NEVER** approve PRs with `any` types
- **NEVER** approve PRs without tests for services
- **NEVER** approve PRs with security vulnerabilities
- **ALWAYS** provide code examples for suggestions
- **ALWAYS** explain WHY changes are needed
- **ALWAYS** acknowledge good work

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Review ensures Blueprint (B) and Link (L) phases are correct
- **Progressive Disclosure**: Core checklist here; detailed examples in `references/`
- **Quality Gates**: Code review is a critical quality gate

## Related Skills

- `verification-before-completion` - Final verification
- `test-driven-development` - Ensure tests exist
- `systematic-debugging` - Debug issues found in review
