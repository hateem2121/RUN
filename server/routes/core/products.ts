import { removeUndefined } from "../../lib/utilities/core-utils.js";

/**
 * PRODUCTS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all product CRUD operations, pagination, filtering, and search
 */

import { insertProductSchema, productByPathSchema, productsQuerySchema } from "@run-remix/shared";
import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { shouldBypassCache, validateIdParam } from "../../lib/utilities/core-utils.js";
import { createRateLimiter } from "../../middleware/rateLimiter.js";
import { productService } from "../../services/product.service.js";
import { webhookService } from "../../services/webhook-service.js";

const writeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many write requests. Please try again later.",
});

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
router.get("/products", async (req, res): Promise<undefined | Response> => {
  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const query = productsQuerySchema.parse(req.query);
  const result = await productService.listProducts({
    ...query,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });

  return result.match(
    (data) => res.json(data),
    (error) => { throw error; },
  );
});

// GET /api/products/by-path - Get product by hierarchical URL path
router.get("/products/by-path", async (req, res): Promise<undefined | Response> => {
  const validation = productByPathSchema.safeParse(req.query);
  if (!validation.success) {
    throw new ValidationError("Invalid path parameter", { issues: validation.error.issues });
  }

  const { path } = validation.data;
  logger.info(`[URL Validation] 🔍 Requested path: "${path}"`);

  const result = await productService.getProductByPath(path);

  if (result.isErr()) {
    if (result.error.name === "NotFoundError") {
      logger.info(`[URL Validation] ❌ Product not found for path "${path}"`);
      res.set("Cache-Control", "public, max-age=600");
      throw result.error;
    }
    throw result.error;
  }

  logger.info(
    `[URL Validation] ✅ Product found for path "${path}" → ${result.value.product?.name}`,
  );
  res.set("Cache-Control", "public, max-age=3600");
  return res.json(result.value);
});

// GET /api/products/:id/3d-model - Get 3D model metadata lazily
router.get("/products/:id/3d-model", async (req, res): Promise<undefined | Response> => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;

  const result = await productService.get3DModelMetadata(id);
  return result.match(
    (data) => {
      res.set("Cache-Control", "public, max-age=900");
      return res.json(data);
    },
    (error) => { throw error; },
  );
});

// GET /api/products/:id - Get single product
router.get("/products/:id", async (req, res): Promise<undefined | Response> => {
  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;

  const result = await productService.getProductById(id);
  return result.match(
    (data) => res.json(data),
    (error) => { throw error; },
  );
});

import { requireRole } from "../../middleware/rbac.js";

// POST /api/products - Create new product
router.post(
  "/products",
  requireRole("admin"),
  writeRateLimiter,
  validateRequest({
    body: insertProductSchema,
  }),
  async (req, res): Promise<void> => {
    const result = await productService.createProduct(removeUndefined(req.body));
    if (result.isErr()) throw result.error;

    webhookService.trigger("product.created", result.value);
    res.status(201).json(result.value);
  },
);

// Shared update handler for both PUT and PATCH
const updateProductHandler = async (req: Request, res: Response): Promise<undefined | Response> => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;

  const result = await productService.updateProduct(id, removeUndefined(req.body));
  if (result.isErr()) throw result.error;

  webhookService.trigger("product.updated", result.value);
  return res.json(result.value);
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
  if (id === null) return;

  const result = await productService.deleteProduct(id);
  if (result.isErr()) throw result.error;

  webhookService.trigger("product.deleted", { id });
  res.status(204).send();
});

export default router;
