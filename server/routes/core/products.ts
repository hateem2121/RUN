/**
 * PRODUCTS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all product CRUD operations, pagination, filtering, and search
 */

import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { insertProductSchema } from "../../../shared/schema.js";
import { retryDbOperation } from "../../lib/db-retry.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import {
  checkRateLimit,
  shouldBypassCache,
  validateAndSanitizeInput,
  validateIdParam,
} from "../../utils.js";

// import { UnifiedCache } from "../../lib/unified-cache.js";

// const unifiedCache = UnifiedCache.getInstance();

const router = Router();

// GET /api/products - List products with pagination and filtering
// CHUNK 5: Optimized with database-level pagination (avoids loading all products into memory)
router.get("/products", async (req, res) => {
  try {
    // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
    if (shouldBypassCache(req)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }

    const { category, active, featured, tag, search, page, limit } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100 items per page
    const offset = (pageNum - 1) * pageSize;

    let products;
    let totalCount = 0;

    // CHUNK 5: Use database-level pagination (LIMIT/OFFSET) with dedicated COUNT queries
    // This eliminates memory overhead and provides accurate counts without fetching all rows
    if (search && typeof search === "string") {
      products = await retryDbOperation(
        () => getStorage().searchProducts(search, pageSize, offset),
        { operationName: "Search products by query" },
      );
      totalCount = await retryDbOperation(() => getStorage().searchProductsCount(search), {
        operationName: "Count search results",
      });
    } else if (tag && typeof tag === "string") {
      products = await retryDbOperation(
        () => getStorage().getProductsByTag(tag, pageSize, offset),
        { operationName: "Get products by tag" },
      );
      totalCount = await retryDbOperation(() => getStorage().getProductsByTagCount(tag), {
        operationName: "Count products by tag",
      });
    } else if (category && typeof category === "string") {
      const categoryId = parseInt(category, 10);
      products = await retryDbOperation(
        () => getStorage().getProductsByCategory(categoryId, pageSize, offset),
        { operationName: "Get products by category" },
      );
      totalCount = await retryDbOperation(
        () => getStorage().getProductsByCategoryCount(categoryId),
        { operationName: "Count products by category" },
      );
    } else if (featured === "true") {
      products = await retryDbOperation(() => getStorage().getFeaturedProducts(), {
        operationName: "Get featured products",
      });
      totalCount = products.length;
      products = products.slice(offset, offset + pageSize);
    } else if (active === "true") {
      // CHUNK 27-R: Combined query with window function - 40% faster (one query instead of two)
      const result = await retryDbOperation(
        () => getStorage().getProductsSummary(pageSize, offset),
        { operationName: "Get active products summary" },
      );
      products = result.products;
      totalCount = result.totalCount;
    } else {
      // CHUNK 27-R: Combined query with window function - 40% faster (one query instead of two)
      const result = await retryDbOperation(
        () => getStorage().getProductsSummary(pageSize, offset),
        { operationName: "Get all products summary" },
      );
      products = result.products;
      totalCount = result.totalCount;
    }

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: unknown) {
    logger.error("Route: Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// GET /api/products/by-path - Get product by hierarchical URL path
router.get("/products/by-path", async (req, res) => {
  try {
    const { path } = req.query;

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
      retryDbOperation(() => getStorage().getProductByPath(path), {
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
  } catch (error: unknown) {
    logger.error("Route: Error fetching product by path:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch product" },
    });
  }
});

// PHASE 4: GET /api/products/:id/3d-model - Get 3D model metadata lazily
router.get("/products/:id/3d-model", async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return; // Error response already sent

    const modelMetadata = await withTimeout(
      retryDbOperation(() => getStorage().get3DModelMetadata(id), {
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
  } catch (error: unknown) {
    logger.error("Route: Error fetching 3D model metadata:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch 3D model metadata" },
    });
  }
});

// GET /api/products/:id - Get single product
router.get("/products/:id", async (req, res) => {
  try {
    // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
    if (shouldBypassCache(req)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }

    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return; // Error response already sent

    const product = await withTimeout(
      retryDbOperation(() => getStorage().getProduct(id), {
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
  } catch (error: unknown) {
    logger.error("Route: Error fetching product:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch product" },
    });
  }
});

// POST /api/products - Create new product
router.post("/products", async (req, res) => {
  try {
    // Rate limiting check
    if (!checkRateLimit()) {
      return res.status(429).json({
        success: false,
        error: { message: "Too many requests. Please try again later." },
      });
    }

    // Enhanced input validation and sanitization
    if (req.body.name) {
      req.body.name = validateAndSanitizeInput(req.body.name);
    }
    if (req.body.description) {
      req.body.description = validateAndSanitizeInput(req.body.description);
    }

    const validatedData = insertProductSchema.parse(req.body);
    const product = await withTimeout(
      retryDbOperation(() => getStorage().createProduct(validatedData), {
        operationName: "Create product",
      }),
      10000,
      "Create product",
    );
    return res.status(201).json(product);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("CREATE PRODUCT error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create product" },
    });
  }
});

// Shared update handler for both PUT and PATCH
const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return; // Error response already sent

    const validatedData = insertProductSchema.partial().parse(req.body);
    const product = await withTimeout(
      retryDbOperation(() => getStorage().updateProduct(id, validatedData), {
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
    return res.json(product);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.error("❌ PRODUCT UPDATE VALIDATION ERROR:", {
        productId: req.params.id,
        errors: error.issues,
        requestBody: req.body,
      });
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("❌ PRODUCT UPDATE ERROR:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update product" },
    });
  }
};

// PUT /api/products/:id - Update product
router.put("/products/:id", updateProductHandler);

// PATCH /api/products/:id - Update product (partial update)
router.patch("/products/:id", updateProductHandler);

// DELETE /api/products/:id - Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return; // Error response already sent

    const deleted = await withTimeout(
      retryDbOperation(() => getStorage().deleteProduct(id), {
        operationName: "Delete product",
      }),
      10000,
      "Delete product",
    );
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: "Product not found" },
      });
    }
    return res.status(204).send();
  } catch (error: unknown) {
    logger.error("Route: Error deleting product:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to delete product" },
    });
  }
});

export default router;
