---
trigger: always_on
---

# RULE 2: Code Standards & Patterns
## TypeScript, React 19, Express 5, Tailwind V4

---

## TypeScript Standards

### ✅ ALWAYS DO

```typescript
// Proper interfaces
interface ProductCardProps {
  productId: string;
  onSelect: (id: string) => void;
  variant?: 'default' | 'compact';
}

// Explicit return types
async function fetchProduct(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

// Proper type guards
function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

### ❌ NEVER DO

```typescript
// NO 'any' type - FORBIDDEN
function processData(data: any) { }

// NO implicit any
function calculate(x, y) { } // Missing types

// NO type assertions without validation
const product = data as Product; // Unsafe
```

---

## React 19 Patterns

### ✅ CORRECT PATTERNS

```typescript
// Named exports with functional components
export function ProductCard({ productId, onSelect }: ProductCardProps) {
  const [isSelected, setIsSelected] = useState(false);
  
  return (
    <div onClick={() => onSelect(productId)}>
      {productId}
    </div>
  );
}

// Raw ref prop (React 19 - NO forwardRef)
interface InputProps {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
}

export function CustomInput({ ref, value, onChange }: InputProps) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2"
    />
  );
}

// Proper hooks usage
export function useProduct(productId: string) {
  const [data, setData] = useState<Product | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function fetch() {
      try {
        const product = await productService.getById(productId);
        if (!cancelled) setData(product);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    
    fetch();
    return () => { cancelled = true; };
  }, [productId]);

  return { data, error, isLoading };
}
```

### ❌ FORBIDDEN PATTERNS

```typescript
// NO forwardRef (deprecated in React 19)
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// NO default exports for components
export default function ProductCard() { } // Use named exports

// NO class components (use functional only)
class ProductCard extends React.Component { } // Forbidden
```

---

## Express 5 Backend Patterns

### ✅ CORRECT PATTERNS

```typescript
// Async handlers (Express 5 handles errors automatically)
router.post('/products', async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(product);
});

// Thin routes - delegate to services
router.get('/products', async (req, res) => {
  const products = await productService.getAll(req.query);
  res.json(products);
});

// Thick services - business logic here
// services/productService.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
  price: z.number().positive(),
});

export type CreateProductData = z.infer<typeof createProductSchema>;

export async function createProduct(data: CreateProductData): Promise<Product> {
  // Validate
  const validated = createProductSchema.parse(data);
  
  // Business logic
  const product = {
    id: generateId(),
    ...validated,
    createdAt: new Date(),
  };
  
  // Database operation
  await db.products.insert(product);
  
  return product;
}
```

### ❌ FORBIDDEN PATTERNS

```typescript
// NO business logic in routes
router.post('/products', async (req, res) => {
  // WRONG - validation, business logic in route
  if (!req.body.name) {
    return res.status(400).json({ error: 'Name required' });
  }
  const product = await db.products.create(req.body);
  res.json(product);
});

// NO try/catch in Express 5 async handlers (handled automatically)
router.get('/products', async (req, res) => {
  try { // Unnecessary in Express 5
    const products = await productService.getAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## Tailwind V4 Styling

### ✅ CORRECT PATTERNS

```typescript
// Use CVA for variants
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'rounded-md font-medium transition-colors focus-visible:outline-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Custom CSS in @utility layer
// styles.css
@layer utilities {
  .gradient-run-brand {
    background: linear-gradient(
      135deg,
      theme('colors.brand.blue'),
      theme('colors.brand.green')
    );
  }
  
  .text-balance {
    text-wrap: balance;
  }
}

// Usage in JSX
<div className="gradient-run-brand text-balance">
  Content here
</div>
```

### ❌ FORBIDDEN PATTERNS

```typescript
// NO arbitrary values in JSX
<div className="w-[342px] h-[128px]"> // WRONG - define in config

// NO inline styles (use Tailwind classes)
<div style={{ width: '342px' }}> // WRONG

// NO mixing arbitrary values
<div className="p-[23px] m-[17px]"> // WRONG - use standard spacing
```

---

## Validation with Zod

### ✅ ALWAYS VALIDATE

```typescript
import { z } from 'zod';

// Define schemas
const orderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(10000),
  customization: z.object({
    color: z.string().max(50),
    size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
    logo: z.string().url().optional(),
  }),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    country: z.string().length(2), // ISO country code
    zipCode: z.string().min(1),
  }),
});

// Type inference
export type OrderData = z.infer<typeof orderSchema>;

// Use in routes
router.post('/orders', async (req, res) => {
  const validatedData = orderSchema.parse(req.body); // Throws on invalid
  const order = await orderService.create(validatedData);
  res.status(201).json(order);
});

// Safe parsing (doesn't throw)
const result = orderSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.errors });
}
```

---

## Error Handling Patterns

### Client-Side (React)

```typescript
// Error boundaries for critical sections
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ProductPage() {
  return (
    <ErrorBoundary fallback={<ProductErrorFallback />}>
      <ProductViewer />
      <ProductDetails />
    </ErrorBoundary>
  );
}

// Loading and error states (ALWAYS handle these)
function ProductDetails({ productId }: { productId: string }) {
  const { data, error, isLoading } = useProduct(productId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState message="Product not found" />;

  return <div>{/* Product content */}</div>;
}
```

### Server-Side (Express)

```typescript
// Custom error classes
export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product ${productId} not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Service layer
export async function getProduct(id: string): Promise<Product> {
  const product = await db.products.findById(id);
  if (!product) {
    throw new ProductNotFoundError(id);
  }
  return product;
}

// Express 5 handles these automatically
```

---

## Common Mistakes to Avoid

❌ Using `any` in TypeScript  
❌ Using `forwardRef` in React 19  
❌ Arbitrary Tailwind values in JSX  
❌ Business logic in routes  
❌ React Three Fiber for 3D  
❌ Forgetting error boundaries  
❌ No loading states  
❌ Skipping Zod validation  
❌ Missing TypeScript return types

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD