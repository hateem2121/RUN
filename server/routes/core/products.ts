import { removeUndefined } from "../../utils.js";

/**
 * PRODUCTS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all product CRUD operations, pagination, filtering, and search
 */

import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { insertProductSchema, type ProductSummary } from "../../../shared/index.js";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";
import { productRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { webhookService } from "../../services/webhook-service.js";
import { checkRateLimit, shouldBypassCache, validateIdParam } from "../../utils.js";

// import { UnifiedCache } from "../../lib/cache/unified-cache.js";

// const unifiedCache = UnifiedCache.getInstance();

const router = Router();

// OpenAPI Registration
registry.registerPath({
  method: "get",
  path: "/products",
  summary: "List all products",
  description:
    "Retrieve products with pagination, filtering, and search. Supports bulk retrieval for B2B integrations.",
  tags: ["Products"],
  parameters: [
    {
      name: "category",
      in: "query",
      schema: { type: "integer" },
      description: "Filter by category ID",
    },
    { name: "tag", in: "query", schema: { type: "string" }, description: "Filter by tag" },
    {
      name: "search",
      in: "query",
      schema: { type: "string" },
      description: "Search by name or SKU",
    },
    {
      name: "featured",
      in: "query",
      schema: { type: "string", enum: ["true", "false"] },
      description: "Filter featured products",
    },
    {
      name: "active",
      in: "query",
      schema: { type: "string", enum: ["true", "false"] },
      description: "Filter active products",
    },
    {
      name: "page",
      in: "query",
      schema: { type: "integer", default: 1 },
      description: "Page number",
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "integer", default: 20 },
      description: "Items per page (max 100)",
    },
  ],
  responses: {
    200: jsonResponse(
      z.object({
        data: z.array(z.any()),
        pagination: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number(),
          hasMore: z.boolean(),
        }),
      }),
      "Paginated list of products",
    ),
  },
});

registry.registerPath({
  method: "get",
  path: "/products/by-path",
  summary: "Get product by URL path",
  description:
    "Resolve a hierarchical URL path to a product with its full context (category, breadcrumbs, etc.).",
  tags: ["Products"],
  parameters: [
    {
      name: "path",
      in: "query",
      required: true,
      schema: { type: "string" },
      description: "Hierarchical path (e.g., '/activewear/tops/performance-tee')",
    },
  ],
  responses: {
    200: jsonResponse(z.any(), "The product with its full context"),
    404: { description: "Product not found for the given path" },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/{id}",
  summary: "Get product by ID",
  description:
    "Retrieve full details for a specific product including technical specs and media references.",
  tags: ["Products"],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Product ID",
    },
  ],
  responses: {
    200: jsonResponse(z.any(), "Complete product details"),
    404: { description: "Product not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/{id}/3d-model",
  summary: "Get product 3D model metadata",
  description: "Retrieve GLB/GLTF model metadata for interactive 3D visualization.",
  tags: ["Products"],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Product ID",
    },
  ],
  responses: {
    200: jsonResponse(z.any(), "3D model metadata"),
    404: { description: "3D model not found for this product" },
  },
});

registry.registerPath({
  method: "post",
  path: "/products",
  summary: "Create a new product",
  description: "Add a new product to the catalog. Admin role required.",
  tags: ["Products"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertProductSchema,
        },
      },
    },
  },
  responses: {
    201: jsonResponse(z.any(), "The created product"),
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "put",
  path: "/products/{id}",
  summary: "Update product (Full)",
  description: "Replace a product's entire configuration. Admin role required.",
  tags: ["Products"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertProductSchema,
        },
      },
    },
  },
  responses: {
    200: jsonResponse(z.any(), "The updated product"),
    404: { description: "Product not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/products/{id}",
  summary: "Update product (Partial)",
  description: "Partially update specific fields of a product. Admin role required.",
  tags: ["Products"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertProductSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: jsonResponse(z.any(), "The partially updated product"),
    404: { description: "Product not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/products/{id}",
  summary: "Delete product",
  description: "Soft-delete a product from the catalog. Admin role required.",
  tags: ["Products"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    204: { description: "Product deleted successfully" },
    404: { description: "Product not found" },
  },
});

// GET /api/products - List products with pagination and filtering
// CHUNK 5: Optimized with database-level pagination (avoids loading all products into memory)
router.get("/products", async (req, res): Promise<undefined | Response> => {
  // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const ProductsQuerySchema = z.object({
    category: z.string().optional(),
    active: z.string().optional(),
    featured: z.string().optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  });

  const query = ProductsQuerySchema.parse(req.query);
  const { category, active, featured, tag, search, page, limit } = query;

  // Parse pagination parameters
  const pageNum = parseInt(page as string, 10) || 1;
  const pageSize = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100 items per page
  const offset = (pageNum - 1) * pageSize;

  let products: ProductSummary[] = [];
  let totalCount = 0;

  // CHUNK 5: Use database-level pagination (LIMIT/OFFSET) with dedicated COUNT queries
  // This eliminates memory overhead and provides accurate counts without fetching all rows
  if (search && typeof search === "string") {
    const filters: {
      categoryId?: number;
      isActive?: boolean;
      isFeatured?: boolean;
    } = {};

    if (category) filters.categoryId = parseInt(category as string, 10);
    if (active === "true") filters.isActive = true;
    else if (active === "false") filters.isActive = false;
    if (featured === "true") filters.isFeatured = true;
    else if (featured === "false") filters.isFeatured = false;

    products = await retryDbOperation(
      () => productRepository.searchProducts(search, filters, pageSize, offset),
      { operationName: "Search products by query" },
    );
    totalCount = await retryDbOperation(
      () => productRepository.searchProductsCount(search, filters),
      {
        operationName: "Count search results",
      },
    );
  } else if (tag && typeof tag === "string") {
    products = await retryDbOperation(
      () => productRepository.getProductsByTag(tag, pageSize, offset),
      { operationName: "Get products by tag" },
    );
    totalCount = await retryDbOperation(() => productRepository.getProductsByTagCount(tag), {
      operationName: "Count products by tag",
    });
  } else if (category && typeof category === "string") {
    const categoryId = parseInt(category, 10);
    products = await retryDbOperation(
      () => productRepository.getProductsByCategory(categoryId, pageSize, offset),
      { operationName: "Get products by category" },
    );
    totalCount = await retryDbOperation(
      () => productRepository.getProductsByCategoryCount(categoryId),
      { operationName: "Count products by category" },
    );
  } else if (featured === "true") {
    products = await retryDbOperation(() => productRepository.getFeaturedProducts(), {
      operationName: "Get featured products",
    });
    totalCount = products.length;
    products = products.slice(offset, offset + pageSize);
  } else if (active === "true") {
    // CHUNK 27-R: Combined query with window function - 40% faster (one query instead of two)
    const result = await retryDbOperation(
      () => productRepository.getProductsSummary(pageSize, offset),
      { operationName: "Get active products summary" },
    );
    products = result.products;
    totalCount = result.totalCount;
  } else {
    // CHUNK 27-R: Combined query with window function - 40% faster (one query instead of two)
    const result = await retryDbOperation(
      () => productRepository.getProductsSummary(pageSize, offset),
      { operationName: "Get all products summary" },
    );
    products = result.products;
    totalCount = result.totalCount;
  }

  // console.log("Sending products response:", { count: products?.length, total: totalCount });

  const totalPages = Math.ceil(totalCount / pageSize);

  return res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total: totalCount,
      pages: totalPages,
      hasMore: pageNum < totalPages,
    },
  });
});

// GET /api/products/by-path - Get product by hierarchical URL path
router.get("/products/by-path", async (req, res): Promise<undefined | Response> => {
  const ProductByPathSchema = z.object({
    path: z.string(),
  });

  const { path } = ProductByPathSchema.parse(req.query);

  if (!path || typeof path !== "string") {
    logger.warn(`[URL Validation] ❌ Missing or invalid path parameter`);
    return res.status(400).json({
      success: false,
      error: { message: "Path parameter is required" },
    });
  }

  // Log the requested path for tracking
  logger.info(`[URL Validation] 🔍 Requested path: "${path}"`);

  // Repository layer (product-repository.ts) handles all caching including 404s
  const productContext = await withTimeout(
    retryDbOperation(() => productRepository.getProductByPath(path), {
      operationName: "Get product by path",
    }),
    10000,
    "Get product by path",
  );

  if (!productContext) {
    logger.info(`[URL Validation] ❌ Product not found for path "${path}"`);
    res.set("Cache-Control", "public, max-age=600"); // 10 minutes for 404s
    return res.status(404).json({
      success: false,
      error: { message: "Product not found" },
    });
  }

  logger.info(
    `[URL Validation] ✅ Product found for path "${path}" → ${productContext.product?.name} (ID: ${productContext.product?.id})`,
  );

  // Set browser cache headers (60 minutes)
  // Note: Repository layer (product-repository.ts) handles server-side caching
  res.set("Cache-Control", "public, max-age=3600"); // 60 minutes

  return res.json(productContext);
});

// PHASE 4: GET /api/products/:id/3d-model - Get 3D model metadata lazily
router.get("/products/:id/3d-model", async (req, res): Promise<undefined | Response> => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) {
    return; // Error response already sent
  }

  const modelMetadata = await withTimeout(
    retryDbOperation(() => productRepository.get3DModelMetadata(id), {
      operationName: "Get 3D model metadata",
    }),
    5000,
    "Get 3D model metadata",
  );

  if (!modelMetadata) {
    return res.status(404).json({
      success: false,
      error: { message: "3D model not found for this product" },
    });
  }

  // Set cache headers for browser caching (15 minutes)
  res.set("Cache-Control", "public, max-age=900");

  return res.json(modelMetadata);
});

// GET /api/products/:id - Get single product
router.get("/products/:id", async (req, res): Promise<undefined | Response> => {
  // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const id = validateIdParam(req, res, "id", "product");
  if (id === null) {
    return; // Error response already sent
  }

  const product = await withTimeout(
    retryDbOperation(() => productRepository.getProduct(id), {
      operationName: "Get product by ID",
    }),
    5000,
    "Get product by ID",
  );
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: "Product not found" },
    });
  }
  return res.json(product);
});

import { requireRole } from "../../middleware/rbac.js";

// POST /api/products - Create new product
router.post(
  "/products",
  requireRole("admin"),
  validateRequest({
    body: insertProductSchema,
  }),
  async (req, res): Promise<void> => {
    // Rate limiting check
    if (!checkRateLimit()) {
      res.status(429).json({
        success: false,
        error: { message: "Too many requests. Please try again later." },
      });
      return;
    }

    // Input sanitization handled by middleware and Zod schema
    const validatedData = req.body;

    const product = await withTimeout(
      retryDbOperation(() => productRepository.createProduct(removeUndefined(validatedData)), {
        operationName: "Create product",
      }),
      10000,
      "Create product",
    );

    // Trigger Webhook
    webhookService.trigger("product.created", product);

    res.status(201).json(product);
  },
);

// Shared update handler for both PUT and PATCH
const updateProductHandler = async (req: Request, res: Response): Promise<undefined | Response> => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) {
    return; // Error response already sent
  }

  // Input sanitization handled by middleware and Zod schema
  const validatedData = req.body;

  const product = await withTimeout(
    retryDbOperation(() => productRepository.updateProduct(id, removeUndefined(validatedData)), {
      operationName: "Update product",
    }),
    10000,
    "Update product",
  );
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: "Product not found" },
    });
  }

  // Trigger Webhook
  webhookService.trigger("product.updated", product);

  return res.json(product);
};

// PUT /api/products/:id - Update product
router.put(
  "/products/:id",
  requireRole("admin"),
  validateRequest({
    body: insertProductSchema.partial(),
  }),
  updateProductHandler,
);

// PATCH /api/products/:id - Update product (partial update)
router.patch(
  "/products/:id",
  requireRole("admin"),
  validateRequest({
    body: insertProductSchema.partial(),
  }),
  updateProductHandler,
);

// DELETE /api/products/:id - Delete product
router.delete("/products/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) {
    return; // Error response already sent
  }

  const deleted = await withTimeout(
    retryDbOperation(() => productRepository.deleteProduct(id), {
      operationName: "Delete product",
    }),
    10000,
    "Delete product",
  );
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { message: "Product not found" },
    });
    return;
  }

  // Trigger Webhook
  webhookService.trigger("product.deleted", { id });

  res.status(204).send();
});

export default router;
