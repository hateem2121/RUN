# WORKFLOW 1: Feature Development & Bug Fixing
## Most Common Development Tasks

---

## Feature Development Workflow

**Trigger Phrases:**
- "Create [feature name]"
- "Build [feature name]"
- "Add [feature name]"
- "Implement [feature name]"

### Step 1: Analyze Complexity

**Simple Task** (<100 lines, single file):
- Single component creation
- Simple utility function
- Bug fix in one file
- Styling update

**Complex Task** (>100 lines, multiple files, architecture):
- Multi-component features
- API endpoint with service logic
- Authentication/authorization
- Database schema changes
- 3D configurator features

### Step 2A: Simple Task Path

1. **Implement** feature directly
2. **Add TypeScript interfaces** (no `any` types)
3. **Follow RUN Remix standards**:
   - React 19 patterns (no forwardRef)
   - CVA + cn() for styling
   - Zod validation for inputs
   - Services for business logic
4. **Run verification**:
   ```bash
   npm run build  # Check TypeScript
   npm run test   # If tests exist
   ```
5. **Present completed files**

### Step 2B: Complex Task Path

1. **Create `implementation_plan.md` artifact** with:
   ```markdown
   # Implementation Plan: [Feature Name]
   
   ## Summary
   [What and why in 2-3 sentences]
   
   ## Files to Create/Modify
   - path/to/file.tsx - [Purpose]
   
   ## Approach
   1. [High-level step]
   2. [High-level step]
   
   ## Risks/Considerations
   - [Potential issues]
   
   ## Success Criteria
   - [ ] TypeScript builds
   - [ ] Tests pass >80% coverage
   - [ ] Feature works as expected
   ```

2. **Wait for approval** from M. Hateem

3. **Implement step-by-step**:
   - Follow the approved plan
   - Commit after each major step
   - Keep M. Hateem updated on progress

4. **Verify implementation**:
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

5. **Present completed files** with summary of changes

---

## Bug Fix & Debug Workflow

**Trigger Phrases:**
- "Fix [issue]"
- "Debug [problem]"
- "Resolve [error]"
- "[Component] is not working"

### Step 1: Reproduce

- **Understand the issue**:
  - What's the expected behavior?
  - What's happening instead?
  - When did this start?

- **Check relevant files**:
  - Component/function mentioned
  - Related services
  - Recent git changes (if available)

### Step 2: Diagnose

- **Check TypeScript errors**:
  ```bash
  npm run build
  ```

- **Check tests**:
  ```bash
  npm run test
  ```

- **Look for common issues**:
  - Missing type definitions
  - Wrong imports
  - Undefined variables
  - Missing error handling
  - Incorrect prop types

- **Check console errors** (if frontend issue)

### Step 3: Fix

- **Make minimal changes** needed to fix the issue
- **Don't refactor** unless directly related to the bug
- **Add tests** if the bug wasn't caught by existing tests
- **Ensure no regressions** - verify fix doesn't break other features

### Step 4: Verify

```bash
npm run build  # TypeScript passes
npm run test   # All tests pass
npm run lint   # Linting passes
```

### Step 5: Document

- **Explain what was fixed**:
  - Root cause
  - Solution implemented
  - Why this approach

- **Commit message**:
  ```
  fix(component): brief description
  
  [Explanation of root cause and fix]
  
  Fixes #[issue-number]
  ```

---

## Examples

### Example 1: Simple Feature

**User Request:** "Create a CopyButton component"

**Response:**
```typescript
// client/app/components/ui/CopyButton.tsx
import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const copyButtonVariants = cva(
  'inline-flex items-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface CopyButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof copyButtonVariants> {
  text: string;
}

export function CopyButton({
  text,
  variant,
  size,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(copyButtonVariants({ variant, size }), className)}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      {...props}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

✅ Component created and verified with `npm run build`

---

### Example 2: Complex Feature Requiring Plan

**User Request:** "Implement product customization with 3D preview"

**Response:**

I'll create an implementation plan for this complex feature first.

```markdown
# Implementation Plan: Product Customization with 3D Preview

## Summary
Build a product customization interface where B2B clients can select colors, add logos, and preview changes in real-time on a 3D model using @google/model-viewer.

## Files to Create/Modify
- `client/app/components/products/ProductCustomizer.tsx` - Main customization UI
- `client/app/components/products/ColorPicker.tsx` - Color selection component
- `client/app/components/products/LogoUploader.tsx` - Logo upload/placement
- `client/app/components/3d/CustomizableModelViewer.tsx` - 3D viewer with texture swapping
- `server/routes/customization.ts` - API routes for saving/loading customizations
- `server/services/customizationService.ts` - Business logic for customization data
- `shared/types/customization.ts` - TypeScript types for customization data

## Approach
1. Create ColorPicker component with preset brand colors
2. Build LogoUploader with file validation and preview
3. Extend UnifiedModelViewer to support dynamic texture/color changes
4. Create ProductCustomizer as container component
5. Implement API endpoints for saving customization preferences
6. Add real-time 3D preview updates as user changes options

## Risks/Considerations
- Performance: 3D texture swapping must be smooth (<100ms)
- File size: Logo uploads limited to 2MB
- Browser compatibility: model-viewer works on all modern browsers
- State management: Complex state (color, logo, size) needs careful handling

## Success Criteria
- [ ] User can select from 10+ preset colors
- [ ] User can upload logo (PNG/SVG, max 2MB)
- [ ] 3D model updates in real-time (<100ms)
- [ ] Customization data persists to API
- [ ] All TypeScript types defined
- [ ] Tests pass with >80% coverage
- [ ] Accessible (keyboard navigation works)

## Rollback Plan
Feature is additive - can disable via feature flag if issues arise.
```

Shall I proceed with implementation?

---

### Example 3: Bug Fix

**User Request:** "Fix TypeScript error in ProductCard - 'price' is possibly undefined"

**Response:**

I'll diagnose and fix the TypeScript error.

**Diagnosis:**
The ProductCard component is not handling the case where `product.price` might be undefined. This happens when products are fetched from the API but price data is missing.

**Fix:**
```typescript
// Before (error)
export function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>  // Error: price possibly undefined
    </div>
  );
}

// After (fixed)
export function ProductCard({ product }: { product: Product }) {
  const formattedPrice = product.price 
    ? `$${product.price.toFixed(2)}`
    : 'Price not available';

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{formattedPrice}</p>
    </div>
  );
}
```

**Root cause:** Product type allows `price?: number` (optional), but code assumed it was always present.

**Verification:**
✅ `npm run build` - TypeScript passes
✅ Component gracefully handles missing price

**Commit:**
```
fix(products): handle undefined price in ProductCard

Product price is optional in the API response but component
assumed it was always present, causing TypeScript error.
Added graceful fallback text when price is missing.

Fixes #142
```

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD