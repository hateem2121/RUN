---
trigger: always_on
---

# RULE 4: Performance, Security & Accessibility
## Production-Ready Standards

---

## Performance Guidelines

### Code Splitting & Lazy Loading

```typescript
// ✅ ALWAYS lazy load heavy components
import { lazy, Suspense } from 'react';

const ProductConfigurator = lazy(() => import('./ProductConfigurator'));
const OrderHistory = lazy(() => import('./OrderHistory'));
const Admin3DEditor = lazy(() => import('./Admin3DEditor'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/configure" element={<ProductConfigurator />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/admin/3d" element={<Admin3DEditor />} />
      </Routes>
    </Suspense>
  );
}
```

### React Performance Optimizations

```typescript
// Use useMemo for expensive computations
const sortedProducts = useMemo(() => {
  return products
    .filter(p => p.category === selectedCategory)
    .sort((a, b) => a.price - b.price);
}, [products, selectedCategory]);

// Use useCallback for function props
const handleProductSelect = useCallback((id: string) => {
  setSelectedProducts(prev => [...prev, id]);
  trackEvent('product_selected', { productId: id });
}, []);

// Memo for expensive components
export const ProductCard = memo(function ProductCard({ 
  product, 
  onSelect 
}: ProductCardProps) {
  return (
    <div onClick={() => onSelect(product.id)}>
      {/* Component content */}
    </div>
  );
});
```

### Image Optimization

```typescript
// ✅ ALWAYS use responsive images
function ProductImage({ product }: { product: Product }) {
  return (
    <picture>
      <source 
        srcSet={`/images/products/${product.id}.webp`} 
        type="image/webp" 
      />
      <source 
        srcSet={`/images/products/${product.id}.jpg`} 
        type="image/jpeg" 
      />
      <img
        src={`/images/products/${product.id}.jpg`}
        alt={product.name}
        loading="lazy"
        width={800}
        height={600}
        className="w-full h-auto"
      />
    </picture>
  );
}
```

### API Performance

```typescript
// ✅ ALWAYS paginate large datasets
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

router.get('/products', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  
  const result = await productService.getAllPaginated({ 
    page, 
    pageSize,
    filters: req.query.filters 
  });
  
  res.json(result);
});

// ✅ Implement caching for expensive operations
import { cache } from '@/lib/cache';

export async function getProductCategories(): Promise<Category[]> {
  const cached = cache.get('product-categories');
  if (cached) return cached;
  
  const categories = await db.categories.findAll();
  cache.set('product-categories', categories, 3600); // 1 hour
  
  return categories;
}
```

---

## Security Standards

### Authentication & Authorization

```typescript
// ✅ ALWAYS validate JWT tokens in middleware
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = await userService.getById(decoded.userId);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Use in routes
router.get('/orders', authMiddleware, async (req, res) => {
  const orders = await orderService.getByUserId(req.user.id);
  res.json(orders);
});
```

### Input Validation (Critical)

```typescript
// ✅ ALWAYS validate ALL external inputs with Zod
import { z } from 'zod';

const orderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(10000),
  customization: z.object({
    color: z.string().max(50).regex(/^[a-zA-Z0-9\s-]+$/),
    size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
    logo: z.string().url().optional(),
  }),
  shippingAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    country: z.string().length(2), // ISO country code
    zipCode: z.string().min(1).max(20),
  }),
});

router.post('/orders', authMiddleware, async (req, res) => {
  // Validate - throws ZodError if invalid
  const validatedData = orderSchema.parse(req.body);
  
  // Now safe to use
  const order = await orderService.create(req.user.id, validatedData);
  res.status(201).json(order);
});
```

### Environment Variables Security

```typescript
// ✅ ALWAYS validate environment variables at startup
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_PORT: z.string().transform(Number),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Usage
import { env } from '@/config/env';

if (env.NODE_ENV === 'production') {
  // Production-only code
}
```

### Rate Limiting

```typescript
// ✅ Implement rate limiting on sensitive endpoints
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
});

router.post('/auth/login', authLimiter, async (req, res) => {
  // Login logic
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
});

router.use('/api/', apiLimiter);
```

### SQL Injection Prevention

```typescript
// ✅ ALWAYS use parameterized queries
// GOOD - Parameterized (safe)
const products = await db.query(
  'SELECT * FROM products WHERE category = $1',
  [category]
);

// ❌ NEVER concatenate user input into queries
// BAD - SQL injection risk
const products = await db.query(
  `SELECT * FROM products WHERE category = '${category}'`
);
```

---

## Accessibility Standards (WCAG AA Minimum)

### Keyboard Navigation

```typescript
// ✅ ALL interactive elements must support keyboard
export function ProductCard({ product, onSelect }: ProductCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(product.id);
    }
  };

  return (
    <button
      onClick={() => onSelect(product.id)}
      onKeyDown={handleKeyDown}
      aria-label={`Select ${product.name}, price $${product.price}`}
      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </button>
  );
}
```

### ARIA Labels & Roles

```typescript
// ✅ ALWAYS provide proper ARIA labels
export function SearchInput({ onSearch }: SearchInputProps) {
  return (
    <div role="search">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        placeholder="Search products..."
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search products"
        className="..."
      />
    </div>
  );
}

// ✅ Use semantic HTML
export function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/products">Products</a></li>
        <li><a href="/orders">Orders</a></li>
        <li><a href="/account">Account</a></li>
      </ul>
    </nav>
  );
}
```

### Focus Management

```typescript
// ✅ Manage focus for modals and dialogs
export function ProductModal({ isOpen, onClose, product }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50"
    >
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <h2 id="modal-title">{product.name}</h2>
        <p>{product.description}</p>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

### Color Contrast

```css
/* ✅ ENSURE WCAG AA contrast ratios (4.5:1 for normal text) */
:root {
  --text-primary: #1a1a1a; /* High contrast with white bg */
  --text-secondary: #4a4a4a; /* Still meets 4.5:1 */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --accent: #0066cc; /* Meets 4.5:1 on white */
}
```

### Screen Reader Support

```typescript
// ✅ Announce dynamic content changes
export function ProductList({ products, isLoading }: ProductListProps) {
  return (
    <div>
      <div aria-live="polite" aria-atomic="true">
        {isLoading && <span className="sr-only">Loading products...</span>}
      </div>
      
      <ul aria-label="Product list">
        {products.map(product => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      
      {products.length === 0 && (
        <p role="status">No products found</p>
      )}
    </div>
  );
}
```

---

## Accessibility Checklist

Before completing any user-facing feature, verify:

- [ ] **Keyboard:** All interactive elements accessible via Tab/Enter/Space
- [ ] **Focus:** Visible focus indicators (ring, outline, background change)
- [ ] **ARIA:** Proper labels for screen readers
- [ ] **Semantic HTML:** Use correct elements (nav, button, header, etc.)
- [ ] **Contrast:** Text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] **Alt Text:** All images have descriptive alt attributes
- [ ] **Forms:** Labels associated with inputs
- [ ] **Announcements:** Dynamic content changes announced to screen readers
- [ ] **Modals:** Focus trapped, Escape key closes

---

## Performance Checklist

- [ ] **Bundle Size:** Initial bundle <500KB gzipped
- [ ] **Lazy Loading:** Heavy components code-split
- [ ] **Images:** Optimized, lazy loaded, responsive
- [ ] **3D Models:** Compressed GLB files (<2MB each)
- [ ] **API:** Paginated endpoints, proper caching
- [ ] **Memoization:** Expensive computations memoized
- [ ] **Database:** Indexed queries, no N+1 problems

---

## Security Checklist

- [ ] **Authentication:** JWT validation in middleware
- [ ] **Input Validation:** Zod schemas for all external data
- [ ] **Environment:** Variables validated at startup
- [ ] **Rate Limiting:** Implemented on auth and API endpoints
- [ ] **SQL Injection:** Parameterized queries only
- [ ] **XSS:** React escapes by default, verify dangerouslySetInnerHTML not used
- [ ] **CSRF:** Tokens for state-changing operations
- [ ] **Dependencies:** No critical vulnerabilities (`npm audit`)

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD