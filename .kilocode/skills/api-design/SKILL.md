---
name: api-design
description: Use this skill when designing, implementing, or reviewing RESTful API endpoints. Use this for creating consistent, well-documented APIs following RUN Remix standards.
---

# API Design

## Goal

Design and implement consistent, well-documented RESTful APIs that follow industry best practices and RUN Remix standards, ensuring maintainability, scalability, and developer experience.

## Instructions

### Phase 1: API Design Principles

1. **RESTful Resource Naming**
   ```markdown
   ## Resource Naming Conventions
   
   ### Use Nouns, Not Verbs
   ✅ GET /products
   ✅ POST /orders
   ❌ GET /getProducts
   ❌ POST /createOrder
   
   ### Use Plural for Collections
   ✅ /products
   ✅ /orders
   ❌ /product
   ❌ /order
   
   ### Use Hierarchical Structure for Relationships
   ✅ /products/{id}/variants
   ✅ /orders/{id}/items
   ✅ /users/{id}/addresses
   
   ### Use Kebab-Case for Multi-Word Resources
   ✅ /product-categories
   ✅ /order-items
   ❌ /productCategories
   ❌ /order_items
   ```

2. **HTTP Methods and Their Usage**
   ```markdown
   ## HTTP Method Semantics
   
   | Method | Usage | Idempotent | Safe |
   |--------|-------|------------|------|
   | GET | Retrieve resource(s) | Yes | Yes |
   | POST | Create new resource | No | No |
   | PUT | Replace entire resource | Yes | No |
   | PATCH | Partial update | No | No |
   | DELETE | Remove resource | Yes | No |
   
   ### Examples
   GET    /products           # List all products
   GET    /products/{id}      # Get single product
   POST   /products           # Create new product
   PUT    /products/{id}      # Replace entire product
   PATCH  /products/{id}      # Update partial product
   DELETE /products/{id}      # Delete product
   ```

3. **HTTP Status Codes**
   ```typescript
   // Success Responses
   200 OK              // Successful GET, PUT, PATCH
   201 Created         // Successful POST (include Location header)
   204 No Content      // Successful DELETE
   
   // Client Errors
   400 Bad Request     // Invalid request body/params
   401 Unauthorized    // Authentication required
   403 Forbidden       // Authenticated but not authorized
   404 Not Found       // Resource doesn't exist
   409 Conflict        // Resource conflict (duplicate)
   422 Unprocessable   // Validation failed
   429 Too Many Requests // Rate limit exceeded
   
   // Server Errors
   500 Internal Error  // Unexpected server error
   502 Bad Gateway     // External service error
   503 Unavailable     // Service temporarily unavailable
   ```

### Phase 2: Request/Response Design

1. **Request Body Structure**
   ```typescript
   // Use consistent request body structure
   // shared/validators/product.ts
   import { z } from 'zod';
   
   export const createProductSchema = z.object({
     name: z.string().min(1).max(200),
     description: z.string().max(2000).optional(),
     price: z.number().positive(),
     category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
     sizes: z.array(z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'])).min(1),
     colors: z.array(z.string()).min(1),
     sustainable: z.boolean(),
     images: z.array(z.string().url()).min(1).max(10),
   });
   
   export type CreateProductInput = z.infer<typeof createProductSchema>;
   
   export const updateProductSchema = createProductSchema.partial();
   export type UpdateProductInput = z.infer<typeof updateProductSchema>;
   ```

2. **Response Body Structure**
   ```typescript
   // Success Response Structure
   interface ApiResponse<T> {
     success: true;
     data: T;
     meta?: {
       page?: number;
       pageSize?: number;
       total?: number;
       totalPages?: number;
     };
   }
   
   // Error Response Structure
   interface ApiErrorResponse {
     success: false;
     error: {
       code: string;
       message: string;
       details?: unknown;
     };
   }
   
   // Example: Single Resource
   // GET /products/prod-123
   {
     "success": true,
     "data": {
       "id": "prod-123",
       "name": "Performance T-Shirt",
       "price": 29.99,
       "category": "activewear",
       "createdAt": "2026-02-15T10:00:00Z",
       "updatedAt": "2026-02-15T10:00:00Z"
     }
   }
   
   // Example: Collection with Pagination
   // GET /products?page=1&pageSize=20
   {
     "success": true,
     "data": [
       { "id": "prod-123", "name": "Performance T-Shirt" },
       { "id": "prod-456", "name": "Running Jacket" }
     ],
     "meta": {
       "page": 1,
       "pageSize": 20,
       "total": 150,
       "totalPages": 8
     }
   }
   
   // Example: Error Response
   // POST /products (validation error)
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Validation failed",
       "details": [
         {
           "path": ["price"],
           "message": "Price must be positive"
         }
       ]
     }
   }
   ```

3. **Query Parameters for Filtering/Sorting**
   ```typescript
   // Standard Query Parameters
   interface ProductQueryParams {
     // Pagination
     page?: number;        // Default: 1
     pageSize?: number;    // Default: 20, Max: 100
     
     // Filtering
     category?: string;
     minPrice?: number;
     maxPrice?: number;
     sustainable?: boolean;
     
     // Sorting
     sortBy?: 'name' | 'price' | 'createdAt';
     sortOrder?: 'asc' | 'desc';
     
     // Search
     search?: string;
   }
   
   // Example: Complex Query
   // GET /products?category=activewear&minPrice=20&maxPrice=100&sortBy=price&sortOrder=asc&page=1&pageSize=20
   
   // Service Implementation
   export async function getProducts(params: ProductQueryParams) {
     const {
       page = 1,
       pageSize = 20,
       sortBy = 'createdAt',
       sortOrder = 'desc',
       ...filters
     } = params;
     
     const query = db.products.findMany({
       where: buildFilters(filters),
       orderBy: { [sortBy]: sortOrder },
       skip: (page - 1) * pageSize,
       take: Math.min(pageSize, 100),
     });
     
     const [data, total] = await Promise.all([
       query,
       db.products.count({ where: buildFilters(filters) }),
     ]);
     
     return {
       success: true,
       data,
       meta: {
         page,
         pageSize,
         total,
         totalPages: Math.ceil(total / pageSize),
       },
     };
   }
   ```

### Phase 3: Route Implementation

1. **Express 5 Route Structure**
   ```typescript
   // server/routes/products.ts
   import { Router } from 'express';
   import * as productService from '../services/productService';
   import { authMiddleware, adminMiddleware } from '../middleware/auth';
   import { validateRequest } from '../middleware/validation';
   import { createProductSchema, updateProductSchema } from '@run-remix/shared';
   
   const router = Router();
   
   // Public routes
   router.get('/products', async (req, res) => {
     const result = await productService.getProducts(req.query);
     res.json(result);
   });
   
   router.get('/products/:id', async (req, res) => {
     const product = await productService.getProduct(req.params.id);
     res.json({ success: true, data: product });
   });
   
   // Protected routes (require authentication)
   router.post('/products', 
     authMiddleware,
     adminMiddleware,
     validateRequest(createProductSchema),
     async (req, res) => {
       const product = await productService.createProduct(req.body);
       res.status(201)
         .header('Location', `/products/${product.id}`)
         .json({ success: true, data: product });
     }
   );
   
   router.patch('/products/:id',
     authMiddleware,
     adminMiddleware,
     validateRequest(updateProductSchema),
     async (req, res) => {
       const product = await productService.updateProduct(req.params.id, req.body);
       res.json({ success: true, data: product });
     }
   );
   
   router.delete('/products/:id',
     authMiddleware,
     adminMiddleware,
     async (req, res) => {
       await productService.deleteProduct(req.params.id);
       res.status(204).send();
     }
   );
   
   export default router;
   ```

2. **Validation Middleware**
   ```typescript
   // server/middleware/validation.ts
   import { Request, Response, NextFunction } from 'express';
   import { ZodSchema } from 'zod';
   import { ValidationError } from '../errors';
   
   export function validateRequest(schema: ZodSchema) {
     return (req: Request, _res: Response, next: NextFunction) => {
       const result = schema.safeParse(req.body);
       
       if (!result.success) {
         throw new ValidationError('Validation failed', result.error.issues);
       }
       
       // Replace req.body with validated data
       req.body = result.data;
       next();
     };
   }
   
   export function validateParams(schema: ZodSchema) {
     return (req: Request, _res: Response, next: NextFunction) => {
       const result = schema.safeParse(req.params);
       
       if (!result.success) {
         throw new ValidationError('Invalid parameters', result.error.issues);
       }
       
       req.params = result.data as Record<string, string>;
       next();
     };
   }
   
   export function validateQuery(schema: ZodSchema) {
     return (req: Request, _res: Response, next: NextFunction) => {
       const result = schema.safeParse(req.query);
       
       if (!result.success) {
         throw new ValidationError('Invalid query parameters', result.error.issues);
       }
       
       req.query = result.data as Record<string, string>;
       next();
     };
   }
   ```

3. **Service Layer Implementation**
   ```typescript
   // server/services/productService.ts
   import { db } from '../db';
   import { NotFoundError, ConflictError, ValidationError } from '../errors';
   import type { CreateProductInput, UpdateProductInput } from '@run-remix/shared';
   
   export async function getProducts(params: ProductQueryParams) {
     const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;
     
     const where = buildFilters(filters);
     
     const [data, total] = await Promise.all([
       db.products.findMany({
         where,
         orderBy: { [sortBy]: sortOrder },
         skip: (page - 1) * pageSize,
         take: Math.min(pageSize, 100),
       }),
       db.products.count({ where }),
     ]);
     
     return {
       success: true,
       data,
       meta: {
         page,
         pageSize,
         total,
         totalPages: Math.ceil(total / pageSize),
       },
     };
   }
   
   export async function getProduct(id: string) {
     const product = await db.products.findById(id);
     
     if (!product) {
       throw new NotFoundError('Product', id);
     }
     
     return product;
   }
   
   export async function createProduct(input: CreateProductInput) {
     // Check for duplicate SKU
     if (input.sku) {
       const existing = await db.products.findBySku(input.sku);
       if (existing) {
         throw new ConflictError(`Product with SKU ${input.sku} already exists`);
       }
     }
     
     const product = await db.products.create({
       ...input,
       id: generateId(),
       createdAt: new Date(),
       updatedAt: new Date(),
     });
     
     return product;
   }
   
   export async function updateProduct(id: string, input: UpdateProductInput) {
     // Verify product exists
     await getProduct(id);
     
     const product = await db.products.update(id, {
       ...input,
       updatedAt: new Date(),
     });
     
     return product;
   }
   
   export async function deleteProduct(id: string) {
     // Verify product exists
     await getProduct(id);
     
     await db.products.delete(id);
   }
   
   // Helper function
   function buildFilters(filters: Record<string, unknown>) {
     const where: Record<string, unknown> = {};
     
     if (filters.category) {
       where.category = filters.category;
     }
     
     if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
       where.price = {
         gte: filters.minPrice,
         lte: filters.maxPrice,
       };
     }
     
     if (filters.sustainable !== undefined) {
       where.sustainable = filters.sustainable;
     }
     
     if (filters.search) {
       where.OR = [
         { name: { contains: filters.search, mode: 'insensitive' } },
         { description: { contains: filters.search, mode: 'insensitive' } },
       ];
     }
     
     return where;
   }
   ```

### Phase 4: API Documentation

1. **JSDoc Comments for Routes**
   ```typescript
   /**
    * @route GET /products
    * @description Retrieve a paginated list of products with optional filtering
    * @query {number} page - Page number (default: 1)
    * @query {number} pageSize - Items per page (default: 20, max: 100)
    * @query {string} category - Filter by category
    * @query {number} minPrice - Minimum price filter
    * @query {number} maxPrice - Maximum price filter
    * @query {string} sortBy - Sort field (name, price, createdAt)
    * @query {string} sortOrder - Sort direction (asc, desc)
    * @query {string} search - Search term for name/description
    * @returns {Object} Paginated product list with metadata
    * @example
    * GET /products?category=activewear&minPrice=20&sortBy=price
    */
   router.get('/products', async (req, res) => { ... });
   
   /**
    * @route POST /products
    * @description Create a new product (admin only)
    * @auth Required, admin role
    * @body {CreateProductInput} Product data
    * @returns {Object} Created product with 201 status
    * @throws {ValidationError} 400 - Invalid input data
    * @throws {ConflictError} 409 - Duplicate SKU
    * @throws {UnauthorizedError} 401 - Not authenticated
    * @throws {ForbiddenError} 403 - Not admin
    */
   router.post('/products', authMiddleware, adminMiddleware, async (req, res) => { ... });
   ```

2. **OpenAPI/Swagger Documentation**
   ```yaml
   # openapi.yaml
   openapi: 3.0.3
   info:
     title: RUN Remix API
     version: 1.0.0
     description: B2B Sportswear Manufacturing Platform API
   
   paths:
     /products:
       get:
         summary: List products
         tags: [Products]
         parameters:
           - name: page
             in: query
             schema:
               type: integer
               minimum: 1
               default: 1
           - name: pageSize
             in: query
             schema:
               type: integer
               minimum: 1
               maximum: 100
               default: 20
           - name: category
             in: query
             schema:
               type: string
               enum: [activewear, teamwear, outerwear, casualwear]
         responses:
           '200':
             description: Successful response
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/ProductListResponse'
   
   components:
     schemas:
       Product:
         type: object
         properties:
           id:
             type: string
           name:
             type: string
           price:
             type: number
           category:
             type: string
           createdAt:
             type: string
             format: date-time
       
       ProductListResponse:
         type: object
         properties:
           success:
             type: boolean
           data:
             type: array
             items:
               $ref: '#/components/schemas/Product'
           meta:
             type: object
             properties:
               page:
                 type: integer
               pageSize:
                 type: integer
               total:
                 type: integer
               totalPages:
                 type: integer
   ```

### Phase 5: Error Handling

1. **Custom Error Classes**
   ```typescript
   // server/errors/index.ts
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
     constructor(resource: string, identifier?: string) {
       super(
         `${resource}${identifier ? ` with id ${identifier}` : ''} not found`,
         404,
         'NOT_FOUND'
       );
     }
   }
   
   export class ConflictError extends AppError {
     constructor(message: string) {
       super(message, 409, 'CONFLICT');
     }
   }
   ```

2. **Global Error Handler**
   ```typescript
   // server/middleware/errorHandler.ts
   import { Request, Response, NextFunction } from 'express';
   import { AppError, ValidationError } from '../errors';
   import { ZodError } from 'zod';
   
   export function errorHandler(
     error: Error,
     req: Request,
     res: Response,
     _next: NextFunction
   ) {
     console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, error);
     
     // Handle known errors
     if (error instanceof AppError) {
       const response = {
         success: false,
         error: {
           code: error.code,
           message: error.message,
         },
       };
       
       if (error instanceof ValidationError && error.details) {
         response.error.details = error.details;
       }
       
       return res.status(error.statusCode).json(response);
     }
     
     // Handle Zod validation errors
     if (error instanceof ZodError) {
       return res.status(400).json({
         success: false,
         error: {
           code: 'VALIDATION_ERROR',
           message: 'Validation failed',
           details: error.issues,
         },
       });
     }
     
     // Handle unexpected errors
     return res.status(500).json({
       success: false,
       error: {
         code: 'INTERNAL_ERROR',
         message: process.env.NODE_ENV === 'production'
           ? 'An unexpected error occurred'
           : error.message,
       },
     });
   }
   ```

## Examples

### Example 1: Complete CRUD Endpoint

```typescript
// server/routes/products.ts
import { Router } from 'express';
import * as productService from '../services/productService';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { 
  createProductSchema, 
  updateProductSchema,
  productQuerySchema,
  idParamSchema 
} from '@run-remix/shared';

const router = Router();

/**
 * @route GET /products
 * @description List all products with pagination and filtering
 * @access Public
 */
router.get('/products',
  validateQuery(productQuerySchema),
  async (req, res) => {
    const result = await productService.getProducts(req.query);
    res.json(result);
  }
);

/**
 * @route GET /products/:id
 * @description Get a single product by ID
 * @access Public
 */
router.get('/products/:id',
  validateParams(idParamSchema),
  async (req, res) => {
    const product = await productService.getProduct(req.params.id);
    res.json({ success: true, data: product });
  }
);

/**
 * @route POST /products
 * @description Create a new product
 * @access Admin only
 */
router.post('/products',
  authMiddleware,
  adminMiddleware,
  validateRequest(createProductSchema),
  async (req, res) => {
    const product = await productService.createProduct(req.body);
    res.status(201)
      .header('Location', `/products/${product.id}`)
      .json({ success: true, data: product });
  }
);

/**
 * @route PATCH /products/:id
 * @description Update an existing product
 * @access Admin only
 */
router.patch('/products/:id',
  authMiddleware,
  adminMiddleware,
  validateParams(idParamSchema),
  validateRequest(updateProductSchema),
  async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  }
);

/**
 * @route DELETE /products/:id
 * @description Delete a product
 * @access Admin only
 */
router.delete('/products/:id',
  authMiddleware,
  adminMiddleware,
  validateParams(idParamSchema),
  async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  }
);

export default router;
```

### Example 2: Nested Resource Routes

```typescript
// server/routes/orders.ts
import { Router } from 'express';
import * as orderService from '../services/orderService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

/**
 * @route GET /orders
 * @description List user's orders
 */
router.get('/orders', async (req, res) => {
  const orders = await orderService.getUserOrders(req.user.id, req.query);
  res.json({ success: true, data: orders });
});

/**
 * @route POST /orders
 * @description Create a new order
 */
router.post('/orders', async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201)
    .header('Location', `/orders/${order.id}`)
    .json({ success: true, data: order });
});

/**
 * @route GET /orders/:id
 * @description Get order details
 */
router.get('/orders/:id', async (req, res) => {
  const order = await orderService.getOrder(req.params.id, req.user.id);
  res.json({ success: true, data: order });
});

/**
 * @route GET /orders/:id/items
 * @description Get order items (nested resource)
 */
router.get('/orders/:id/items', async (req, res) => {
  const items = await orderService.getOrderItems(req.params.id, req.user.id);
  res.json({ success: true, data: items });
});

/**
 * @route PATCH /orders/:id/status
 * @description Update order status (admin only)
 */
router.patch('/orders/:id/status', 
  adminMiddleware,
  async (req, res) => {
    const order = await orderService.updateOrderStatus(
      req.params.id, 
      req.body.status
    );
    res.json({ success: true, data: order });
  }
);

export default router;
```

## API Design Checklist

```markdown
## Resource Design
- [ ] Resources use nouns, not verbs
- [ ] Collection names are plural
- [ ] Nested resources follow hierarchy
- [ ] URLs use kebab-case

## HTTP Methods
- [ ] GET for retrieval (safe, idempotent)
- [ ] POST for creation
- [ ] PUT for full replacement
- [ ] PATCH for partial updates
- [ ] DELETE for removal

## Status Codes
- [ ] 200 for successful GET/PUT/PATCH
- [ ] 201 for successful POST
- [ ] 204 for successful DELETE
- [ ] 400 for validation errors
- [ ] 401 for authentication required
- [ ] 403 for authorization failed
- [ ] 404 for not found
- [ ] 409 for conflicts
- [ ] 500 for server errors

## Request/Response
- [ ] Consistent request body structure
- [ ] Consistent response envelope
- [ ] Pagination for collections
- [ ] Filtering/sorting support
- [ ] Error response structure

## Security
- [ ] Authentication middleware
- [ ] Authorization checks
- [ ] Input validation with Zod
- [ ] Rate limiting on sensitive endpoints

## Documentation
- [ ] JSDoc comments on routes
- [ ] OpenAPI/Swagger spec
- [ ] Example requests/responses
- [ ] Error code documentation
```

## Constraints

- **NEVER** use verbs in URLs
- **NEVER** return raw database objects
- **ALWAYS** validate input with Zod
- **ALWAYS** use consistent response structure
- **ALWAYS** include proper status codes
- **ALWAYS** document endpoints

## Related Skills

- `error-handling` - Implement error handling patterns
- `verification-before-completion` - Verify API implementation
- `code-review` - Review API code
