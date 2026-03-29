---
trigger: always_on
---

# RULE 3: Development Workflow & Testing
## How to Work, When to Plan, What to Test

---

## Development Workflow

### For Simple Tasks (<100 lines, single file)

1. **Implement** the feature/fix directly
2. **Verify TypeScript** with `npm run build`
3. **Run tests** with `npm run test` (if test files exist)
4. **Format** with Biome if needed
5. **Provide** the completed file(s)

**Examples of simple tasks:**
- Create a Button component
- Add a new utility function
- Fix a TypeScript error
- Update component styling

---

### For Complex Tasks (>100 lines, multiple files, architecture)

1. **PLAN FIRST** - Create `implementation_plan.md` artifact
2. **WAIT** for approval from M. Hateem
3. **EXECUTE** according to approved plan
4. **VERIFY** with build + tests
5. **PROVIDE** completed files with summary

**Examples of complex tasks:**
- Add OAuth2 authentication
- Build product customization system
- Implement order processing flow
- Create 3D model configurator

---

## Implementation Plan Template

When creating a plan, use this structure:

```markdown
# Implementation Plan: [Feature Name]

## Summary
[2-3 sentence overview of what will be built and why]

## Files to Create/Modify
- `path/to/file1.tsx` - [What changes and why]
- `path/to/file2.ts` - [What changes and why]
- `path/to/file3.test.ts` - [Test coverage]

## Approach
1. [High-level step 1]
2. [High-level step 2]
3. [High-level step 3]
4. [Integration and testing]

## Risks/Considerations
- [Potential issue 1 and mitigation]
- [Breaking change warning if applicable]
- [Performance considerations]
- [Security implications]

## Success Criteria
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] All tests pass with >80% coverage (`npm run test`)
- [ ] No console errors in browser
- [ ] Feature works as expected
- [ ] Biome linting passes
- [ ] [Feature-specific criteria]

## Rollback Plan
[How to undo changes if something goes wrong]
```

**Example:**

```markdown
# Implementation Plan: OAuth2 Google Login

## Summary
Add Google OAuth2 as an alternative login method for B2B clients. Users can sign in with Google, linking to existing accounts by email or creating new accounts.

## Files to Create/Modify
- `server/middleware/passport.ts` - Configure Google OAuth strategy
- `server/routes/auth.ts` - Add /auth/google and /auth/google/callback routes
- `server/services/authService.ts` - Add linkGoogleAccount() method
- `client/app/components/auth/GoogleLoginButton.tsx` - New Google sign-in button
- `client/app/pages/LoginPage.tsx` - Add Google button to login page
- `server/services/authService.test.ts` - Test OAuth linking logic

## Approach
1. Configure Passport.js with Google strategy in server middleware
2. Create OAuth routes for initiating flow and handling callback
3. Implement service logic for account linking/creation
4. Build GoogleLoginButton component with proper error handling
5. Integrate button into LoginPage with loading states
6. Test full OAuth flow end-to-end

## Risks/Considerations
- Breaking change: None - existing email/password auth unchanged
- Security: Store OAuth tokens encrypted, validate state parameter
- UX: Handle case where Google email already exists with different provider
- Testing: Need Google OAuth test credentials

## Success Criteria
- [ ] OAuth flow completes successfully
- [ ] Existing email/password login still works
- [ ] Tokens stored securely (encrypted)
- [ ] Tests pass with >80% coverage
- [ ] No security vulnerabilities (check with npm audit)
- [ ] Error messages clear for users

## Rollback Plan
Feature is additive - disable OAuth routes and hide Google button if issues arise.
```

---

## Testing Standards (Vitest)

### What to Test (Priority Order)

1. **ALWAYS test:**
   - Service functions (business logic)
   - Complex utility functions
   - Data transformations
   - API integrations

2. **Often test:**
   - Custom hooks
   - Critical user flows
   - Complex components

3. **Optionally test:**
   - Simple UI components
   - Pure presentational components

**Coverage Goal:** Aim for 80%+ on services and utilities

---

## Test Patterns

### Service Tests

```typescript
// productService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct, getProduct, deleteProduct } from './productService';
import { ProductNotFoundError } from './errors';

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'Performance T-Shirt',
        category: 'activewear' as const,
        price: 29.99,
        materials: ['polyester', 'spandex'],
      };

      const result = await createProduct(productData);

      expect(result).toMatchObject(productData);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid price', async () => {
      const productData = {
        name: 'Test Product',
        category: 'activewear' as const,
        price: -10,
        materials: ['cotton'],
      };

      await expect(createProduct(productData)).rejects.toThrow(
        'Price must be positive'
      );
    });

    it('should throw error for empty materials array', async () => {
      const productData = {
        name: 'Test Product',
        category: 'activewear' as const,
        price: 29.99,
        materials: [],
      };

      await expect(createProduct(productData)).rejects.toThrow(
        'At least one material required'
      );
    });
  });

  describe('getProduct', () => {
    it('should return product by id', async () => {
      const product = await getProduct('test-id-123');
      
      expect(product).toBeDefined();
      expect(product.id).toBe('test-id-123');
    });

    it('should throw ProductNotFoundError for invalid id', async () => {
      await expect(getProduct('invalid-id')).rejects.toThrow(
        ProductNotFoundError
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and return true', async () => {
      const result = await deleteProduct('test-id-123');
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent product', async () => {
      await expect(deleteProduct('invalid-id')).rejects.toThrow(
        ProductNotFoundError
      );
    });
  });
});
```

### Hook Tests

```typescript
// useProduct.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useProduct } from './useProduct';
import * as productService from '@/services/productService';

vi.mock('@/services/productService');

describe('useProduct', () => {
  it('should fetch product data on mount', async () => {
    const mockProduct = {
      id: '123',
      name: 'Test Product',
      price: 29.99,
    };

    vi.mocked(productService.getProduct).mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProduct('123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockProduct);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(productService.getProduct).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProduct('123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(mockError);
    });
  });
});
```

### Component Tests (Critical Ones Only)

```typescript
// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '123',
    name: 'Performance T-Shirt',
    price: 29.99,
    image: '/images/test.jpg',
  };

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} onSelect={() => {}} />);

    expect(screen.getByText('Performance T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<ProductCard product={mockProduct} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('123');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible', () => {
    const onSelect = vi.fn();
    render(<ProductCard product={mockProduct} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('123');
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test productService.test.ts
```

---

## Uncertainty Protocol (Critical)

**If you're unsure about:**

- **File locations** → List 2-3 most likely paths, ask M. Hateem for confirmation
- **Breaking changes** → Highlight in implementation plan, get approval
- **Architecture decisions** → Propose 2-3 options with tradeoffs
- **API contracts** → Never guess - check existing code or ask
- **Business logic** → Never assume - ask about RUN APPAREL's workflows

**When in doubt, ASK. Don't implement based on assumptions.**

### Example Uncertainty Handling:

```
"I found two possible locations for the inventory service:
1. server/services/inventoryService.ts (doesn't exist yet)
2. server/services/productService.ts (existing, could extend)

Option 1 keeps concerns separated (better for long-term)
Option 2 reduces file count but mixes responsibilities

Which approach do you prefer?"
```

---

## Code Quality Checklist

Before completing any task, verify:

- [ ] **TypeScript:** No errors (`npm run build`)
- [ ] **Tests:** Pass with >80% coverage on services
- [ ] **Linting:** Biome passes
- [ ] **Types:** No `any` types used
- [ ] **Validation:** Zod schemas for external inputs
- [ ] **Error Handling:** Loading, error, empty states
- [ ] **Accessibility:** Keyboard support, ARIA labels
- [ ] **3D:** Using @google/model-viewer (NOT drei)
- [ ] **Styling:** CVA + cn() (NO arbitrary values)
- [ ] **Services:** Business logic in services, not routes

---

## Git Commit Message Format

```
type(scope): brief description

[optional body explaining what and why]

[optional footer with breaking changes]
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change without behavior change
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks

### Examples:

```
feat(products): add 3D model preview to product cards

Added LazyUnifiedModelViewer component to ProductCard for
interactive 3D previews. Improves engagement for B2B clients.

fix(orders): correct tax calculation for international orders

Order total was missing tax for international clients.
Added proper tax calculation in orderService.calculateTotal().

Fixes #127

test(auth): add OAuth2 integration tests

Added comprehensive tests for Google OAuth flow including
account linking and error scenarios.
```

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD