# RESTful API Design Guidelines

## Overview

This reference provides comprehensive guidelines for designing RESTful APIs in the RUN Remix project, following industry best practices and Express 5 patterns.

---

## Core Principles

### 1. Resource-Oriented Design

```
✅ GOOD: /products, /orders, /users
❌ BAD: /getProducts, /createOrder, /deleteUser
```

- Use **nouns** for resources, not verbs
- Use **plural** names for collections
- Keep URLs **lowercase** and **kebab-case**

### 2. HTTP Methods Semantics

| Method | Usage | Idempotent | Safe |
|--------|-------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create new resource | No | No |
| PUT | Replace entire resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

### 3. Statelessness

Every request must contain all information needed to process it. No client context stored on server between requests.

---

## URL Structure

### Resource Naming

```
# Collection
GET /products

# Specific resource
GET /products/{id}

# Sub-resource
GET /products/{id}/reviews

# Sub-resource collection
GET /products/{id}/variants

# Action on resource (use sparingly)
POST /orders/{id}/cancel
```

### Query Parameters

```
# Filtering
GET /products?category=activewear&status=active

# Sorting
GET /products?sort=price&order=desc

# Pagination
GET /products?page=2&limit=20

# Field selection
GET /products?fields=id,name,price

# Search
GET /products?search=running+shirt
```

### URL Anti-Patterns

```
❌ DON'T:
/products/getAll
/products/create
/products/delete/123
/products/123/delete
/product (singular)
/Products (capitalized)
/products/123/ (trailing slash)
```

---

## Request/Response Patterns

### Standard Response Structure

```typescript
// Success - Single Resource
interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Success - Collection
interface CollectionResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Status Codes

```typescript
// 2xx Success
200 OK              // GET, PUT, PATCH success
201 Created         // POST success (include Location header)
204 No Content      // DELETE success (no body)

// 4xx Client Errors
400 Bad Request     // Validation error
401 Unauthorized    // Missing/invalid auth
403 Forbidden       // Authenticated but not authorized
404 Not Found       // Resource doesn't exist
409 Conflict        // Duplicate resource
422 Unprocessable   // Validation failed
429 Too Many Requests // Rate limited

// 5xx Server Errors
500 Internal Error  // Unexpected server error
502 Bad Gateway     // Upstream service error
503 Service Unavailable // Server overloaded
```

### Express 5 Route Examples

```typescript
// GET /products - List products
router.get('/products', async (req, res) => {
  const { page = 1, limit = 20, category, sort } = req.query;
  
  const result = await productService.getAll({
    page: Number(page),
    limit: Math.min(Number(limit), 100),
    category: category as string,
    sort: sort as string,
  });
  
  res.json(result);
});

// GET /products/:id - Get single product
router.get('/products/:id', async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json({ data: product });
});

// POST /products - Create product
router.post('/products', async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201)
    .location(`/products/${product.id}`)
    .json({ data: product });
});

// PUT /products/:id - Replace product
router.put('/products/:id', async (req, res) => {
  const product = await productService.replace(req.params.id, req.body);
  res.json({ data: product });
});

// PATCH /products/:id - Update product
router.patch('/products/:id', async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  res.json({ data: product });
});

// DELETE /products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
  await productService.delete(req.params.id);
  res.status(204).send();
});
```

---

## Validation with Zod

### Schema Definition

```typescript
// shared/validators/product.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(999999.99),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
  sizes: z.array(z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'])).min(1),
  colors: z.array(z.string().min(1)).min(1).max(20),
  sustainable: z.boolean().default(false),
  images: z.array(z.string().url()).min(1).max(10),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']).optional(),
  sort: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});
```

### Route Validation

```typescript
// middleware/validate.ts
import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed',
          details: result.error.issues,
        },
      });
    }
    
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: result.error.issues,
        },
      });
    }
    
    req.query = result.data;
    next();
  };
}
```

### Usage in Routes

```typescript
import { validateBody, validateQuery } from '@/middleware/validate';
import { createProductSchema, productQuerySchema } from '@/validators/product';

router.post(
  '/products',
  validateBody(createProductSchema),
  async (req, res) => {
    // req.body is now typed and validated
    const product = await productService.create(req.body);
    res.status(201).json({ data: product });
  }
);

router.get(
  '/products',
  validateQuery(productQuerySchema),
  async (req, res) => {
    // req.query is now typed and validated
    const result = await productService.getAll(req.query);
    res.json(result);
  }
);
```

---

## Pagination

### Offset-Based Pagination

```typescript
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Service
async function getAllPaginated(
  params: PaginationParams & FilterParams
): Promise<PaginatedResult<Product>> {
  const { page, limit, ...filters } = params;
  const offset = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    db.products.findMany({
      where: filters,
      skip: offset,
      take: limit,
    }),
    db.products.count({ where: filters }),
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
```

### Cursor-Based Pagination (for large datasets)

```typescript
interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// Service
async function getAllCursorPaginated(
  params: CursorPaginationParams
): Promise<CursorPaginatedResult<Product>> {
  const { cursor, limit } = params;
  
  const data = await db.products.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  
  return {
    data: items,
    pagination: {
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    },
  };
}
```

---

## Error Handling

### Custom Error Classes

```typescript
// errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### Global Error Handler (Express 5)

```typescript
// middleware/errorHandler.ts
import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.issues,
      },
    });
  }

  // Custom app errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Unknown errors
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## Authentication & Authorization

### JWT Authentication

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/errors';
import { env } from '@/config/env';

interface JwtPayload {
  userId: string;
  role: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = await userService.getById(payload.userId);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
```

### Usage

```typescript
import { authenticate, requireRole } from '@/middleware/auth';

// Protected route
router.get('/orders', authenticate, async (req, res) => {
  const orders = await orderService.getByUserId(req.user.id);
  res.json({ data: orders });
});

// Admin-only route
router.delete(
  '/products/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    await productService.delete(req.params.id);
    res.status(204).send();
  }
);
```

---

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Stricter limit for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts',
    },
  },
});

// Apply to routes
router.use('/api', apiLimiter);
router.post('/auth/login', authLimiter, loginHandler);
```

---

## API Versioning

### URL Versioning

```typescript
// Recommended for public APIs
router.use('/api/v1/products', productRoutes);
router.use('/api/v1/orders', orderRoutes);
router.use('/api/v2/products', productRoutesV2);
```

### Header Versioning

```typescript
// middleware/version.ts
export function apiVersion(req: Request, res: Response, next: NextFunction) {
  const version = req.headers['accept-version'] || 'v1';
  req.apiVersion = version;
  next();
}
```

---

## Documentation

### OpenAPI/Swagger

```yaml
openapi: 3.0.0
info:
  title: RUN Remix API
  version: 1.0.0
  description: B2B Sportswear Manufacturing Platform API

paths:
  /products:
    get:
      summary: List all products
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductList'
    post:
      summary: Create a product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProduct'
      responses:
        '201':
          description: Product created
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    API DESIGN QUICK CHECK                        │
├─────────────────────────────────────────────────────────────────┤
│ □ Nouns for resources    □ Plural collection names              │
│ □ Proper HTTP methods    □ Consistent status codes               │
│ □ Zod validation         □ Pagination for lists                  │
│ □ Error handling         □ Rate limiting                         │
│ □ Authentication         □ Versioning strategy                   │
│ □ Documentation          □ Stateless design                      │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0.0 | **For:** RUN Remix @ RUN APPAREL (PVT) LTD
