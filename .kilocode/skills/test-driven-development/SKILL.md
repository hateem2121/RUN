---
name: test-driven-development
description: Use this skill when implementing new features, fixing bugs, or refactoring code. Use this for ensuring code quality through a systematic test-first approach with verification gates.
---

# Test-Driven Development (TDD)

## Goal

Implement production-quality code using a strict test-first methodology that ensures all code is tested before implementation, reducing bugs and improving maintainability.

## Instructions

### Phase 1: Red (Write Failing Test)

1. **Understand the Requirement**
   - Read the feature specification or bug report
   - Identify the expected behavior
   - Define acceptance criteria

2. **Write the Test First**
   - Create a new test file if needed: `*.test.ts` or `*.test.tsx`
   - Write a test that describes the expected behavior
   - Use descriptive test names that explain the requirement
   - Include edge cases and error scenarios

3. **Verify Test Fails**
   - Run the test: `npm run test <test-file>`
   - Confirm the test fails for the right reason
   - The failure should indicate missing implementation, not a syntax error

### Phase 2: Green (Make It Pass)

1. **Write Minimal Implementation**
   - Write only enough code to make the test pass
   - Don't add features not covered by tests
   - Keep implementation simple and focused

2. **Run Tests**
   - Execute: `npm run test`
   - All tests should pass
   - If multiple tests fail, fix one at a time

3. **Verify Coverage**
   - Run: `npm run test:coverage`
   - Target: 80%+ for services, 70%+ for components
   - Identify uncovered lines and add tests if needed

### Phase 3: Refactor (Improve Code)

1. **Review Implementation**
   - Look for code duplication
   - Check for proper separation of concerns
   - Ensure naming conventions are followed

2. **Refactor Safely**
   - Make small, incremental changes
   - Run tests after each change
   - All tests must remain green

3. **Final Verification**
   - Run: `npm run typecheck`
   - Run: `npm run check:apply`
   - Run: `npm run verify:tech-integrity`

## Examples

### Example 1: Service Layer TDD

**Step 1 - Write Failing Test:**

```typescript
// server/services/productService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createProduct } from './productService';

describe('createProduct', () => {
  it('should create a product with valid data', async () => {
    const input = {
      name: 'Performance T-Shirt',
      category: 'activewear' as const,
      price: 29.99,
      sustainable: true,
    };

    const result = await createProduct(input);

    expect(result).toMatchObject(input);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw ValidationError for invalid price', async () => {
    const input = {
      name: 'Test Product',
      category: 'activewear' as const,
      price: -10,
      sustainable: false,
    };

    await expect(createProduct(input)).rejects.toThrow('Validation failed');
  });
});
```

**Step 2 - Implement:**

```typescript
// server/services/productService.ts
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
  price: z.number().positive(),
  sustainable: z.boolean(),
});

export async function createProduct(data: unknown) {
  const validated = createProductSchema.parse(data);
  
  return {
    id: crypto.randomUUID(),
    ...validated,
    createdAt: new Date(),
  };
}
```

**Step 3 - Verify:**

```bash
npm run test server/services/productService.test.ts
# ✓ createProduct > should create a product with valid data
# ✓ createProduct > should throw ValidationError for invalid price
```

### Example 2: React Component TDD

**Step 1 - Write Failing Test:**

```typescript
// client/app/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
  });
});
```

**Step 2 - Implement:**

```typescript
// client/app/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}
```

## Constraints

- **NEVER** write implementation before tests
- **NEVER** skip the Red phase - tests must fail first
- **NEVER** add features not covered by tests
- **NEVER** commit code with failing tests
- **ALWAYS** aim for 80%+ coverage on services
- **ALWAYS** run `npm run verify:tech-integrity` before completion
- **ALWAYS** use descriptive test names that explain behavior

## TDD Checklist

```markdown
## Red Phase
- [ ] Test file created
- [ ] Test describes expected behavior
- [ ] Test fails for the right reason

## Green Phase
- [ ] Minimal implementation written
- [ ] All tests pass
- [ ] Coverage meets target (80%+)

## Refactor Phase
- [ ] Code reviewed for improvements
- [ ] Refactored safely with tests passing
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tech integrity verified
```

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Tests serve as the Blueprint (B) before implementation
- **Progressive Disclosure**: This skill provides the core TDD workflow; additional patterns available in `references/`
- **Quality Gates**: Verification steps ensure production-ready code

## Related Skills

- `verification-before-completion` - Final quality gates
- `systematic-debugging` - When tests reveal issues
- `writing-plans` - For complex features requiring planning
