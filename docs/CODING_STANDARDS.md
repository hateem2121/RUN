# Project Coding Rules (v4.0.1)

**Last Updated:** April 2026  
**For:** RUN APPAREL CMS System  
**Compliance Level:** Mandatory

---

## 🏛️ AntiGravity Project Constitution

**Primary Source of Truth (SSOT)**: [`gemini.md`](../gemini.md)

All coding standards defined here MUST be cross-referenced with the architectural invariants and design laws in `gemini.md`. In case of conflict, `gemini.md` takes precedence.

---

## 🚨 RULE #0: PORT 5002 ABSOLUTE COMPLIANCE (NON-NEGOTIABLE)

**CRITICAL:** This system uses **port 5002** exclusively. This is the FIRST rule for a reason.

### Port Configuration Requirements

**✅ ALWAYS:**

- Use port `5002` in ALL configuration files
- Hardcode port `5002` in server initialization
- Configure Vite dev server to port `5002` with `strictPort: true`
- Set environment variables to port `5002`
- Target `http://localhost:5002` in all API calls

**❌ NEVER:**

- Use environment variables without default to `5002`
- Use ports: 3000, 4000, 5000, 5001, 5003, 8080, 8000
- Allow port to be configurable without explicit override
- Skip port verification before deployment

#### server/server.ts

```typescript
// Port 5002 is strictly enforced in the HTTP server listener
const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 5002;
httpServer.listen(PORT, () => {
  logger.info(`[Startup] HTTP Listener open on port ${PORT}`);
});
```

#### vite.config.ts

```typescript
// Dev server optimization - Host true allows local/LAN access
export default defineConfig({
  server: {
    host: true,
    hmr: { overlay: true },
  },
});
```

### Verification Command (Run Before Every Commit)

```bash
npm run verify-port
```

If this command fails, **DO NOT PROCEED** until fixed.

---

## RULE #1: TypeScript Strict Mode

**No `any` types allowed.** Period.

**✅ CORRECT:**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return userService.findById(id);
}
```

**❌ FORBIDDEN:**

```typescript
function getData(params: any) { } // NEVER
const result: any = await fetch(); // NEVER
```

### Enforcement

- `tsconfig.json` must have `"strict": true`
- Pre-commit hook runs `tsc --noEmit`

---

## RULE #2: React 19 Standards

### No forwardRef (React 19 Native Ref Support)

**✅ CORRECT:**

```typescript
export function Input({ ref, ...props }: { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

**❌ FORBIDDEN:**

```typescript
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### Named Exports Only

**✅ CORRECT:**

```typescript
export function UserProfile({ userId }: Props) {
  return <div>{userId}</div>;
}
```

**❌ FORBIDDEN:**

```typescript
export default function UserProfile() { } // No default exports
```

---

## RULE #3: Express 5 Async Handlers (No Try-Catch Wrappers)

Express 5 automatically handles promise rejections.

**✅ CORRECT:**

```typescript
router.get('/users', async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
});
```

**❌ FORBIDDEN:**

```typescript
router.get('/users', async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Use global error handler middleware instead:

```typescript
// server/middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

// server/index.ts
app.use(errorHandler);
```

---

## RULE #4: 3D Content - Google Model Viewer ONLY

**FORBIDDEN PACKAGES:**

- `@react-three/fiber`
- `@react-three/drei`
- `three` (unless wrapped in UnifiedModelViewer)

**✅ CORRECT:**

```typescript
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';

function ProductView() {
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer 
        src="/models/product.glb"
        alt="3D model"
      />
    </ModelViewerErrorBoundary>
  );
}
```

**❌ FORBIDDEN:**

```typescript
import { useGLTF } from '@react-three/drei'; // NEVER IMPORT THIS
```

---

## RULE #5: Tailwind V4 - @utility Layer for Custom CSS

**✅ CORRECT:**

```css
/* styles.css */
@layer utilities {
  .custom-gradient {
    background: linear-gradient(to right, theme('colors.primary'), theme('colors.secondary'));
  }
}
```

**❌ FORBIDDEN:**

```css
/* No arbitrary values in HTML classes */
<div className="bg-[#ff0000]"> // Don't do this
```

Use CVA for component variants:

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded-md font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white',
        secondary: 'bg-secondary text-white',
      },
    },
  }
);
```

---

## RULE #6: Service-Based Architecture

**Business logic goes in `services/`, NOT in routes.**

**✅ CORRECT:**

```typescript
// server/routes/products.ts
router.get('/products', async (req, res) => {
  const products = await productService.getAll();
  res.json(products);
});

// server/services/productService.ts
export async function getAll() {
  // Complex business logic here
  const products = await db.products.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });
  return products;
}
```

**❌ FORBIDDEN:**

```typescript
// server/routes/products.ts
router.get('/products', async (req, res) => {
  // Don't put business logic directly in routes
  const products = await db.products.findMany({
    where: { isPublished: true },
  });
  res.json(products);
});
```

---

## RULE #7: Every Public Page Has an Admin Counterpart

**Mandatory 1:1 mapping between frontend and admin pages.**

When creating a new public page, you MUST create:

1. Public route
2. Admin route
3. Public API endpoint
4. Admin API endpoint
5. Update route mapping table

**Example:**

```typescript
// Public
<Route path="/products" element={<ProductsPage />} />

// Admin (REQUIRED)
<Route path="/admin/products" element={<ProductsManagementPage />} />

// API - Public
router.get('/api/products', getPublishedProducts);

// API - Admin (REQUIRED)
router.get('/admin/api/products', isAuthenticated, getAllProducts);
```

Update `shared/constants/routeMapping.ts`:

```typescript
{
  public: '/products',
  admin: '/admin/products',
  description: 'Product catalog / Product management',
  apiEndpoint: '/api/products',
}
```

---

## RULE #8: Testing Requirements

### Unit Tests (Vitest)

- Every service function MUST have tests in `server/services/*.test.ts`.
- Minimum 80% coverage for services.

### Integration Tests (MemoryStorage)

- **Mandatory**: Every API endpoint and mutation flow MUST have an integration test.
- **Statefulness**: Use `MemoryStorage` for multi-step verification.
- **RBAC**: Every mutation endpoint MUST verify admin-only access using `createMockSessionUser`.
- **v2 Preferred**: Prefer the `v2` testing pattern implemented in `server/tests/integration/*.integration.test.ts`.

### E2E Tests (Recommended)

- Critical user flows (login, media upload, product configuration) using Playwright.

**Run tests before committing:**

```bash
# Run all vitest suites
npm run test

# Run preferred integration suites
npm run test server/tests/integration/admin-v2.integration.test.ts
```

---

## RULE #9: File Structure Standards

### Client (Frontend)

```
client/
├── app/
│   ├── components/
│   │   ├── ui/              # Generic UI components
│   │   ├── admin/           # Admin-specific components
│   │   └── [domain]/        # Domain-specific components
│   ├── pages/
│   │   ├── admin/           # Admin pages
│   │   └── [page]/          # Public pages
│   ├── routes/
│   │   ├── index.tsx        # Public routes
│   │   └── admin.tsx        # Admin routes
│   ├── hooks/
│   ├── lib/
│   └── styles/
```

### Server (Backend)

```
server/
├── routes/
│   ├── api/
│   │   ├── public.ts        # Public API routes
│   │   └── admin.ts         # Admin API routes
│   └── index.ts
├── services/                # Business logic (thick layer)
├── middleware/
├── models/
├── utils/
└── index.ts                 # Server entry (PORT 5002)
```

---

## RULE #10: Environment Variables

### Required Variables (`.env`)

```bash
# Port Configuration (MANDATORY)
PORT=5002
VITE_API_BASE_URL=http://localhost:5002/api/v1
VITE_ADMIN_BASE_URL=http://localhost:5002/admin

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cms_db

# Session
SESSION_SECRET=your-secret-key

# Optional
NODE_ENV=development
LOG_LEVEL=info
```

### Environment File Rules

- `.env` - local development (gitignored)
- `.env.example` - committed template (port 5002 shown)
- `.env.production` - production secrets (gitignored)

---

## RULE #11: Git Commit Standards

### Pre-Commit Checklist

Before every commit, run:

```bash
npm run verify-port     # Port 5002 compliance
npm run lint            # Biome linting
npm run typecheck       # TypeScript checking
npm run test            # Unit tests
```

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting changes
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**

```
feat(products): add product search functionality
fix(admin): correct port 5002 reference in API client
docs(readme): update port 5002 configuration guide
```

---

## RULE #12: Security Standards

### Authentication

- Admin routes MUST use `isAuthenticated` middleware
- JWT tokens stored in httpOnly cookies
- CSRF protection enabled

### API Security

```typescript
// ✅ CORRECT - Admin API protected
router.use('/admin/api', isAuthenticated);
router.post('/admin/api/products', async (req, res) => {
  // Protected endpoint
});

// ✅ CORRECT - Public API limited
router.get('/api/products', rateLimiter({ max: 100 }), async (req, res) => {
  // Rate-limited public endpoint
});
```

### Input Validation

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  description: z.string().optional(),
});

router.post('/admin/api/products', async (req, res) => {
  const data = ProductSchema.parse(req.body); // Throws if invalid
  const product = await productService.create(data);
  res.status(201).json(product);
});
```

---

## RULE #13: Performance Standards

### Bundle Size

- Main bundle: < 200KB (gzipped)
- Route chunks: < 50KB each
- Use dynamic imports for heavy components

### Lazy Loading

```typescript
// ✅ CORRECT - Lazy load admin pages
const ProductEditorPage = lazy(() => import('@/pages/admin/ProductEditorPage'));

// ✅ CORRECT - Lazy load 3D viewer
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';
```

### API Response Times

- Public API: < 200ms (p95)
- Admin API: < 500ms (p95)
- Use database indexes on frequently queried columns

---

## RULE #14: Accessibility (A11Y)

### Minimum Requirements

- WCAG 2.1 Level AA compliance
- Keyboard navigation for all interactive elements
- ARIA labels where needed
- Color contrast ratio ≥ 4.5:1

```typescript
// ✅ CORRECT
<button 
  aria-label="Delete product"
  onClick={handleDelete}
>
  <TrashIcon />
</button>

// ❌ MISSING aria-label
<button onClick={handleDelete}>
  <TrashIcon />
</button>
```

---

## RULE #15: Error Handling

### Client-Side Errors

```typescript
import { toast } from '@/lib/toast';

try {
  await api.createProduct(data);
  toast.success('Product created successfully');
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

### Server-Side Errors

```typescript
// Use custom error classes
export class NotFoundError extends Error {
  statusCode = 404;
}

export class ValidationError extends Error {
  statusCode = 400;
}

// In service
if (!product) {
  throw new NotFoundError('Product not found');
}

// Global error handler catches and formats
```

---

## Enforcement

These rules are enforced through:

1. **Pre-commit hooks** - Husky + lint-staged
2. **CI/CD pipeline** - GitHub Actions
3. **Code review checklist** - PR template
4. **Automated verification** - `npm run verify-port`

### Pre-Commit Hook Configuration

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run verify-port"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --apply",
      "npm run typecheck"
    ]
  }
}
```

---

## Quick Reference: Port 5002 Compliance

```bash
# Verify port configuration
npm run verify-port

# Check all running processes
lsof -i :5002

# Start dev server (port 5002)
npm run dev

# Build for production
npm run build

# Start production server (port 5002)
npm run start
```

---

## Rule Violations = Build Failures

Violations of these rules will cause:

- ❌ Pre-commit hook failures
- ❌ CI/CD pipeline failures
- ❌ Code review rejections

**Zero tolerance for:**

- Wrong port usage (not 5002)
- `any` types in TypeScript
- Missing admin counterparts for public pages
- React forwardRef usage
- Business logic in routes

---

---

## RULE #16: Database & Caching Optimization

### Caching Strategy (`UnifiedCache`)

- **Tiered Approach**: ALWAYS use `UnifiedCache` for critical paths (Products, Categories, Navigation).
- **L1 Access**: Local in-memory caching for high-frequency low-payload data.
- **L2 Access**: Redis caching for distributed shared state/sessions.
- **Event-Driven**: Repository methods MUST emit invalidation events on data mutation (`emitCacheInvalidation`).

### Database Optimization

- **Indexing**: Every new table/column used for filtering/sorting MUST have a corresponding index.
- **Prepared Statements**: Use `db.execute(sql.prepare(...))` for high-frequency parameterized queries.
- **Cursor Pagination**: Prefer cursor-based pagination (`getProductsCursor`) over offset for large datasets.
- **Resilience**: Wrap critical I/O in `retryDbOperation` and `withCircuit`.

### Monitoring & Observability

- **Slow Query Logging**: Queries exceeding 100ms are automatically logged for audit.
- **Tracing**: All database and cache operations must be instrumented with OpenTelemetry spans.

---

**Maintained by:** Development Team  
**Review Cycle:** Quarterly  
**Questions?** See `docs/TROUBLESHOOTING.md`
