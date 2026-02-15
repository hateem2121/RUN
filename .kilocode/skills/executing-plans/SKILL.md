---
name: executing-plans
description: Use this skill when implementing an approved implementation plan. Use this for systematic execution of planned tasks with proper verification at each step.
---

# Executing Plans

## Goal

Implement approved implementation plans systematically, following each step in order, with proper verification at each stage to ensure production-ready code.

## Instructions

### Phase 1: Pre-Execution Setup

1. **Verify Plan Approval**
   - Confirm the plan has been approved
   - Review the plan one more time
   - Note any clarifications needed

2. **Prepare Environment**
   - Ensure you're on the correct branch
   - Pull latest changes: `git pull`
   - Verify dev environment works: `npm run dev`

3. **Create Working Branch**
   ```bash
   git checkout -b feature/[feature-name]
   # or
   git checkout -b fix/[bug-name]
   ```

### Phase 2: Sequential Execution

1. **Follow Plan Steps in Order**
   - Execute each step sequentially
   - Don't skip ahead
   - Complete each step before moving to the next

2. **For Each File Creation/Modification**
   - Create the file in the correct location
   - Follow naming conventions
   - Implement according to plan
   - Add proper TypeScript types
   - Include error handling

3. **Verify After Each Step**
   - Run `npm run typecheck` to catch errors early
   - Fix any issues before proceeding
   - Don't accumulate errors

### Phase 3: Implementation Patterns

1. **Service Layer Implementation**
   ```typescript
   // server/services/exampleService.ts
   import { z } from 'zod';
   import { db } from '../db';
   
   // Define schema
   export const createExampleSchema = z.object({
     name: z.string().min(1).max(200),
     value: z.number().positive(),
   });
   
   export type CreateExampleInput = z.infer<typeof createExampleSchema>;
   
   // Implement function
   export async function createExample(input: CreateExampleInput) {
     const validated = createExampleSchema.parse(input);
     return db.examples.create(validated);
   }
   ```

2. **Route Handler Implementation**
   ```typescript
   // server/routes/exampleRoutes.ts
   import { Router } from 'express';
   import * as exampleService from '../services/exampleService';
   
   const router = Router();
   
   // Thin route - delegates to service
   router.post('/examples', async (req, res) => {
     const example = await exampleService.createExample(req.body);
     res.status(201).json(example);
   });
   
   export default router;
   ```

3. **React Component Implementation**
   ```typescript
   // client/app/components/examples/ExampleCard.tsx
   import { cn } from '@/lib/utils';
   
   export interface ExampleCardProps {
     id: string;
     name: string;
     value: number;
     className?: string;
   }
   
   export function ExampleCard({ id, name, value, className }: ExampleCardProps) {
     return (
       <div className={cn('rounded-lg border p-4', className)}>
         <h3 className="font-semibold">{name}</h3>
         <p className="text-muted-foreground">${value}</p>
       </div>
     );
   }
   ```

4. **Test Implementation**
   ```typescript
   // server/services/exampleService.test.ts
   import { describe, it, expect, beforeEach } from 'vitest';
   import { createExample } from './exampleService';
   
   describe('exampleService', () => {
     describe('createExample', () => {
       it('should create example with valid data', async () => {
         const input = { name: 'Test', value: 100 };
         const result = await createExample(input);
         
         expect(result).toMatchObject(input);
         expect(result.id).toBeDefined();
       });
       
       it('should throw for invalid data', async () => {
         const invalidInput = { name: '', value: -1 };
         
         await expect(createExample(invalidInput)).rejects.toThrow();
       });
     });
   });
   ```

### Phase 4: Incremental Verification

1. **After Each File**
   ```bash
   npm run typecheck
   ```

2. **After Related Files**
   ```bash
   npm run test path/to/test.test.ts
   ```

3. **After Major Steps**
   ```bash
   npm run build
   npm run test
   ```

### Phase 5: Final Verification

1. **Run Full Verification Pipeline**
   ```bash
   npm run build
   npm run test
   npm run check:apply
   npm run verify:tech-integrity
   ```

2. **Manual Verification**
   - Check for 'any' types
   - Verify naming conventions
   - Confirm file locations
   - Review error handling

3. **Test in Browser** (if applicable)
   - Start dev server: `npm run dev`
   - Test the feature manually
   - Check for console errors
   - Verify accessibility

### Phase 6: Completion

1. **Update Documentation**
   - Add JSDoc comments
   - Update README if needed
   - Document any deviations from plan

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): brief description"
   ```

3. **Report Completion**
   - Summarize what was implemented
   - Note any deviations from plan
   - Provide list of created/modified files

## Execution Checklist

```markdown
## Pre-Execution
- [ ] Plan approved by stakeholder
- [ ] On correct git branch
- [ ] Latest changes pulled
- [ ] Dev environment working

## During Execution
- [ ] Following plan steps in order
- [ ] Running typecheck after each file
- [ ] Running tests after related files
- [ ] Fixing errors immediately

## Post-Execution
- [ ] All files created/modified per plan
- [ ] All tests passing
- [ ] TypeScript builds without errors
- [ ] Biome linting passes
- [ ] Technical integrity verified
- [ ] Documentation updated
- [ ] Changes committed
```

## Examples

### Example 1: Feature Implementation Execution

**Plan Step:** Create search service

**Execution:**
```typescript
// Step 1: Create the service file
// server/services/searchService.ts

import { z } from 'zod';
import { db } from '../db';

// Define types
export interface SearchOptions {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Implement search
export async function searchProducts(options: SearchOptions) {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 20,
  } = options;

  // Build query
  let queryBuilder = db.products.query();
  
  if (query) {
    queryBuilder = queryBuilder.where('name', 'ilike', `%${query}%`);
  }
  
  if (category) {
    queryBuilder = queryBuilder.where('category', category);
  }
  
  if (minPrice !== undefined) {
    queryBuilder = queryBuilder.where('price', '>=', minPrice);
  }
  
  if (maxPrice !== undefined) {
    queryBuilder = queryBuilder.where('price', '<=', maxPrice);
  }

  // Get total count
  const total = await queryBuilder.count();
  
  // Get paginated results
  const data = await queryBuilder
    .offset((page - 1) * pageSize)
    .limit(pageSize);

  return {
    data,
    total,
    page,
    pageSize,
  };
}
```

**Verification:**
```bash
npm run typecheck
# ✓ No errors

npm run test server/services/searchService.test.ts
# ✓ All tests pass
```

### Example 2: Bug Fix Execution

**Plan Step:** Fix null pointer in order calculation

**Execution:**
```typescript
// Step 1: Identify the issue in orderService.ts
// Current code has null pointer risk

// Before (buggy):
export function calculateTotal(order: Order): number {
  return order.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

// After (fixed):
export function calculateTotal(order: Order): number {
  if (!order.items || order.items.length === 0) {
    return 0;
  }
  
  return order.items.reduce((sum, item) => {
    const price = item.price ?? 0;  // Handle null/undefined
    const quantity = item.quantity ?? 1;  // Default to 1
    return sum + price * quantity;
  }, 0);
}
```

**Add Regression Test:**
```typescript
it('should handle null price in items', () => {
  const order = {
    items: [
      { price: null, quantity: 2 },
      { price: 10, quantity: 3 },
    ],
  };
  
  const total = calculateTotal(order);
  
  expect(total).toBe(30); // 0*2 + 10*3
});

it('should handle empty items array', () => {
  const order = { items: [] };
  
  const total = calculateTotal(order);
  
  expect(total).toBe(0);
});
```

**Verification:**
```bash
npm run test server/services/orderService.test.ts
# ✓ All tests pass

npm run typecheck
# ✓ No errors
```

### Example 3: Component Implementation Execution

**Plan Step:** Create ProductSearch component

**Execution:**
```typescript
// Step 1: Create the component
// client/app/components/products/ProductSearch.tsx

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSearch({
  onSearch,
  placeholder = 'Search products...',
  className,
}: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {query && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

**Verification:**
```bash
npm run typecheck
# ✓ No errors

npm run test client/app/components/products/ProductSearch.test.tsx
# ✓ All tests pass
```

## Handling Deviations

### When Plan Needs Adjustment

1. **Stop and Document**
   - Note what's different from plan
   - Explain why adjustment is needed

2. **Get Approval**
   - Ask stakeholder for approval
   - Update plan if significant change

3. **Proceed with Adjustment**
   - Implement the adjusted approach
   - Document in commit message

### Example Deviation Handling

```
**Plan Deviation:**

The plan specified using Redis for caching, but after investigation,
the existing Upstash Redis setup doesn't support the pattern we need.

**Proposed Adjustment:**
Use in-memory caching with TTL instead, which is sufficient for our
use case and doesn't require infrastructure changes.

**Impact:**
- Simpler implementation
- No new dependencies
- Cache won't persist across server restarts (acceptable)

**Approval needed before proceeding.**
```

## Constraints

- **NEVER** skip plan steps without approval
- **NEVER** proceed with failing tests
- **NEVER** commit without verification
- **ALWAYS** follow the plan in order
- **ALWAYS** verify after each step
- **ALWAYS** document deviations

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Execution follows the Link (L) and Tool Atomic (T) phases
- **Progressive Disclosure**: Core workflow here; detailed patterns in `references/`
- **Quality Gates**: Verification at each step ensures quality

## Related Skills

- `writing-plans` - Create the plan before executing
- `verification-before-completion` - Final verification
- `test-driven-development` - Write tests during implementation
- `systematic-debugging` - Debug issues during execution
