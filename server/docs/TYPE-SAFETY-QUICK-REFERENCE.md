# Type Safety Quick Reference Guide

**Sprint 1 Tool Reference for Efficient Type Elimination**

---

## 🚀 Quick Commands

### Audit Commands
```bash
# Count 'any' types in a file
grep -c ": any\|as any\|any\[\]" <file>

# Find all 'any' types in a directory
grep -r ": any\|as any\|any\[\]" <directory> --include="*.ts" --include="*.tsx"

# Count total 'any' types
grep -r ": any\|as any\|any\[\]" server --include="*.ts" | wc -l
grep -r ": any\|as any\|any\[\]" client/src --include="*.ts" --include="*.tsx" | wc -l
```

### Validation Commands
```bash
# TypeScript compilation check
npx tsc --noEmit

# LSP diagnostics (specific file)
# Use get_latest_lsp_diagnostics tool with file_path

# Run tests
npm test
```

---

## 📚 Type Patterns Library

### 1. Express Route Handlers

#### Basic Route
```typescript
// Before
app.get('/api/products', async (req: any, res: any) => {

// After
import { Request, Response } from 'express';
app.get('/api/products', async (req: Request, res: Response) => {
```

#### Route with Params
```typescript
// Before
app.get('/api/products/:id', async (req: any, res: any) => {

// After
app.get('/api/products/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
```

#### Route with Query Params
```typescript
// Before
app.get('/api/products', async (req: any, res: any) => {

// After
interface ProductQueryParams {
  category?: string;
  limit?: string;
  offset?: string;
}
app.get('/api/products', async (
  req: Request<{}, {}, {}, ProductQueryParams>,
  res: Response
) => {
```

#### Route with Body
```typescript
// Before
app.post('/api/products', async (req: any, res: any) => {

// After
app.post('/api/products', async (
  req: Request<{}, {}, InsertProduct>,
  res: Response
) => {
```

### 2. Drizzle Schema Inference

```typescript
// Import schema
import { productsTable } from '@shared/schema';

// Select type
type SelectProduct = typeof productsTable.$inferSelect;

// Insert type (use Zod schema instead)
import { insertProductSchema } from '@shared/schema';
type InsertProduct = z.infer<typeof insertProductSchema>;

// Usage
const products: SelectProduct[] = await db.select().from(productsTable);
```

### 3. React Event Handlers

```typescript
// Mouse Events
onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
onClick: (e: React.MouseEvent<HTMLDivElement>) => void

// Form Events
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
onSubmit: (e: React.FormEvent<HTMLFormElement>) => void

// Keyboard Events
onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void

// Focus Events
onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
```

### 4. React Component Props

```typescript
// Before
function MediaViewer(props: any) {

// After
interface MediaViewerProps {
  mediaId: number;
  onClose: () => void;
  initialMedia?: SelectMedia;
  className?: string;
}

function MediaViewer({ 
  mediaId, 
  onClose, 
  initialMedia,
  className 
}: MediaViewerProps) {
```

### 5. TanStack Query Types

```typescript
// Before
const { data } = useQuery({
  queryKey: ['/api/products'],
  // data is 'any'
});

// After
const { data } = useQuery<SelectProduct[]>({
  queryKey: ['/api/products'],
  // data is SelectProduct[] | undefined
});

// Mutation
const mutation = useMutation<
  SelectProduct,  // Success return type
  Error,          // Error type
  InsertProduct   // Variables type
>({
  mutationFn: async (product: InsertProduct) => {
    const res = await apiRequest<SelectProduct>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.data;
  },
});
```

### 6. Utility Function Generics

```typescript
// Before
function transform(data: any): any {
  return data.map((item: any) => item.name);
}

// After
function transform<T extends { name: string }>(data: T[]): string[] {
  return data.map((item) => item.name);
}

// Or with Record
function transform<T extends Record<string, unknown>>(
  data: T
): TransformedData {
  // ...
}
```

### 7. Async Function Return Types

```typescript
// Before
async function fetchData(): Promise<any> {

// After
async function fetchData(): Promise<SelectProduct[]> {
  const products = await db.select().from(productsTable);
  return products;
}
```

### 8. Object/Record Types

```typescript
// Before
const config: any = { ... };

// After
interface Config {
  apiUrl: string;
  timeout: number;
  retries?: number;
}
const config: Config = { ... };

// Or for dynamic keys
const cache: Record<string, SelectProduct> = {};
```

### 9. Array Types

```typescript
// Before
const items: any[] = [];

// After
const items: SelectProduct[] = [];
const ids: number[] = [];
const names: string[] = [];
```

### 10. Multer File Upload

```typescript
// Before
app.post('/upload', upload.single('file'), (req: any, res: any) => {
  const file = req.file;
});

// After
import { Request, Response } from 'express';
import multer from 'multer';

app.post('/upload', upload.single('file'), (
  req: Request & { file?: Express.Multer.File },
  res: Response
) => {
  const file = req.file;
});
```

---

## 🎯 High-Priority File Patterns

### unified-replit-cache.ts (40 types)
Focus areas:
- Cache entry interface: `CacheEntry<T>`
- Metrics interface: `CacheMetrics`
- Method return types: `get<T>()`, `set<T>()`
- Event emitter types

### routes.ts (30 types)
Focus areas:
- Request/Response types for all routes
- Middleware function signatures
- Error handler types
- Route parameter types

### media-consolidated.ts (24 types)
Focus areas:
- Multer types for file uploads
- Media processing function types
- Response payload interfaces
- Storage operation types

### technology.tsx (64 types)
Focus areas:
- Animation config types
- GSAP timeline types
- Component state interfaces
- Event handler types

---

## ⚡ Efficiency Tips

1. **Use Find & Replace for Patterns**
   - Find: `: any)` → Replace: `: React.MouseEvent<HTMLButtonElement>)`
   - Find: `(e: any)` → Replace: `(e: React.FormEvent)`

2. **Import Types Once**
   ```typescript
   import type { Request, Response } from 'express';
   import type { SelectProduct, SelectMedia } from '@shared/schema';
   ```

3. **Use Type Inference**
   ```typescript
   // Let TypeScript infer when obvious
   const products = await db.select().from(productsTable);
   // TypeScript knows: SelectProduct[]
   ```

4. **Extract Common Interfaces**
   ```typescript
   // Create shared/types.ts for common interfaces
   export interface ApiResponse<T> {
     data: T;
     error?: string;
   }
   ```

---

## 🚨 Common Pitfalls to Avoid

1. **Don't use `any` for unknowns**
   ```typescript
   // Bad
   function parse(data: any) { }
   
   // Good
   function parse(data: unknown) {
     if (typeof data === 'string') { /* ... */ }
   }
   ```

2. **Don't skip error types**
   ```typescript
   // Bad
   } catch (err: any) {
   
   // Good
   } catch (err) {
     if (err instanceof Error) { /* ... */ }
   }
   ```

3. **Don't use `as any` as escape hatch**
   ```typescript
   // Bad
   const data = response as any;
   
   // Good
   const data = response as SelectProduct;
   // Or validate with Zod
   ```

---

## 📊 Progress Tracking

After each file:
1. Count remaining 'any' types: `grep -c ": any" <file>`
2. Run LSP: Check for new errors
3. Test functionality: Ensure no runtime breaks
4. Update tracking doc: Mark file complete

---

*Use this guide to maintain consistency and speed throughout Sprint 1*
