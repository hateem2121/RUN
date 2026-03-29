---
description: Component & API Creation
---

# WORKFLOW 2: Component & API Creation
## Building UI Components and Backend Endpoints

---

## UI Component Creation Workflow

**Trigger Phrases:**
- "Create a [Component] component"
- "Build a [Component]"
- "Make a reusable [Component]"

### Step 1: Determine Location

**Generic UI components** → `client/app/components/ui/`
- Button, Input, Card, Modal, etc.
- Reusable across entire app

**Domain-specific components** → `client/app/components/[domain]/`
- ProductCard → `components/products/`
- OrderSummary → `components/orders/`
- CustomerProfile → `components/customers/`

### Step 2: Create with TypeScript Interface

```typescript
// Define props interface first
interface ComponentNameProps {
  // Required props
  id: string;
  onAction: (data: DataType) => void;
  
  // Optional props
  variant?: 'default' | 'secondary';
  className?: string;
}

// Functional component with named export
export function ComponentName({ 
  id, 
  onAction, 
  variant = 'default',
  className 
}: ComponentNameProps) {
  // Component logic
  return (
    <div className={className}>
      {/* JSX */}
    </div>
  );
}
```

### Step 3: Add CVA Variants (if needed)

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'default-classes',
        secondary: 'secondary-classes',
      },
      size: {
        sm: 'small-classes',
        md: 'medium-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ComponentNameProps
  extends ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof componentVariants> {}

export function ComponentName({ 
  variant, 
  size, 
  className, 
  ...props 
}: ComponentNameProps) {
  return (
    <button
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### Step 4: Ensure Accessibility

- **Keyboard support**: Tab, Enter, Space, Escape
- **ARIA labels**: aria-label, aria-describedby
- **Focus indicators**: visible outlines/rings
- **Semantic HTML**: use correct elements

```typescript
export function AccessibleButton({ 
  label, 
  onClick 
}: { label: string; onClick: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={label}
      className="focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {label}
    </button>
  );
}
```

### Step 5: Verify

```bash
npm run build  # Check TypeScript
```

---

## Component Template

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

const componentVariants = cva(
  'base-classes transition-colors focus-visible:outline-none focus-visible:ring-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ComponentNameProps
  extends ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof componentVariants> {
  // Additional custom props here
}

/**
 * ComponentName - Brief description
 * 
 * @example
 * <ComponentName variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </ComponentName>
 */
export function ComponentName({ 
  variant, 
  size, 
  className,
  children,
  ...props 
}: ComponentNameProps) {
  return (
    <button
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## API Endpoint Creation Workflow

**Trigger Phrases:**
- "Create API endpoint for [resource]"
- "Add [GET/POST/PUT/DELETE] route for [resource]"
- "Build [resource] API"

### Step 1: Service First (Business Logic)

```typescript
// server/services/productService.ts
import { z } from 'zod';
import { db } from '@/lib/database';
import { ProductNotFoundError } from './errors';

// Define Zod validation schema
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
  price: z.number().positive(),
  materials: z.array(z.string()).min(1),
  description: z.string().max(1000).optional(),
});

export type CreateProductData = z.infer<typeof createProductSchema>;

// Service functions (business logic)
export async function createProduct(
  data: CreateProductData
): Promise<Product> {
  // Validate (throws ZodError if invalid)
  const validated = createProductSchema.parse(data);
  
  // Business logic
  const product: Product = {
    id: generateId(),
    ...validated,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Database operation
  await db.products.insert(product);
  
  return product;
}

export async function getProduct(id: string): Promise<Product> {
  const product = await db.products.findById(id);
  
  if (!product) {
    throw new ProductNotFoundError(id);
  }
  
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductData>
): Promise<Product> {
  const existing = await getProduct(id); // Throws if not found
  
  const updated = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };
  
  await db.products.update(id, updated);
  
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  await getProduct(id); // Verify exists
  await db.products.delete(id);
}

// Pagination support
export interface PaginationParams {
  page: number;
  pageSize: number;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

export async function getAllProducts(
  params: PaginationParams
): Promise<PaginatedResponse<Product>> {
  const offset = (params.page - 1) * params.pageSize;
  
  const [products, total] = await Promise.all([
    db.products.findMany({
      where: params.filters,
      limit: params.pageSize,
      offset,
    }),
    db.products.count({ where: params.filters }),
  ]);
  
  return {
    data: products,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
```

### Step 2: Routes (Thin Handlers)

```typescript
// server/routes/productRoutes.ts
import { Router } from 'express';
import * as productService from '../services/productService';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /products - List all products (paginated)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(
    parseInt(req.query.pageSize as string) || 20,
    100
  );
  
  const filters = {
    category: req.query.category as string | undefined,
    minPrice: req.query.minPrice 
      ? parseFloat(req.query.minPrice as string) 
      : undefined,
    maxPrice: req.query.maxPrice 
      ? parseFloat(req.query.maxPrice as string) 
      : undefined,
  };
  
  const result = await productService.getAllProducts({
    page,
    pageSize,
    filters,
  });
  
  res.json(result);
});

// GET /products/:id - Get single product
router.get('/:id', async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  res.json(product);
});

// POST /products - Create product (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  const productData = productService.createProductSchema.parse(req.body);
  const product = await productService.createProduct(productData);
  res.status(201).json(product);
});

// PUT /products/:id - Update product (requires auth)
router.put('/:id', authMiddleware, async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body
  );
  res.json(product);
});

// DELETE /products/:id - Delete product (requires auth)
router.delete('/:id', authMiddleware, async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
});

export default router;
```

### Step 3: Add Tests

```typescript
// server/services/productService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createProduct, getProduct } from './productService';
import { ProductNotFoundError } from './errors';

describe('productService', () => {
  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const data = {
        name: 'Performance T-Shirt',
        category: 'activewear' as const,
        price: 29.99,
        materials: ['polyester', 'spandex'],
      };
      
      const product = await createProduct(data);
      
      expect(product).toMatchObject(data);
      expect(product.id).toBeDefined();
      expect(product.createdAt).toBeInstanceOf(Date);
    });
    
    it('should throw for invalid price', async () => {
      const data = {
        name: 'Test',
        category: 'activewear' as const,
        price: -10,
        materials: ['cotton'],
      };
      
      await expect(createProduct(data)).rejects.toThrow();
    });
  });
  
  describe('getProduct', () => {
    it('should throw ProductNotFoundError for invalid id', async () => {
      await expect(getProduct('invalid')).rejects.toThrow(
        ProductNotFoundError
      );
    });
  });
});
```

### Step 4: Update Types (if needed)

```typescript
// shared/types/product.ts
export interface Product {
  id: string;
  name: string;
  category: 'activewear' | 'teamwear' | 'outerwear' | 'casualwear';
  price: number;
  materials: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### Step 5: Verify

```bash
npm run build  # TypeScript passes
npm run test   # Tests pass
```

---

## Complete API Example

**User Request:** "Create API endpoint for managing customer orders"

**Response includes:**
1. Service with business logic
2. Zod validation schemas
3. Route handlers (thin)
4. TypeScript types
5. Tests for service functions
6. Error handling

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD