import {
  adminProductsQuerySchema,
  hardDeleteSchema,
  type InsertProduct,
  insertProductSchema,
} from "@run-remix/shared";
import { type RequestHandler, Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { getAuditContext } from "../../middleware/request-context.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";

const router = Router();
type ProductsQuery = z.infer<typeof adminProductsQuerySchema>;

/**
 * GET /api/admin/products/initial-data
 * Batch data for product creation/editing
 */
router.get("/initial-data", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getInitialProductsData();

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * GET /api/admin/products
 * List products with pagination and filtering
 */
router.get(
  "/",
  authService.requireAdmin,
  validateRequest({
    query: adminProductsQuerySchema,
  }) as unknown as RequestHandler,
  async (req, res) => {
    const { page, limit, search, categoryId, status } = req.query as unknown as ProductsQuery;
    const result = await adminService.getProductsList(
      removeUndefined({
        page,
        limit,
        search,
        categoryId,
        status,
      }) as unknown as Parameters<typeof adminService.getProductsList>[0],
    );

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * POST /api/admin/products
 * Create new product
 */
router.post(
  "/",
  authService.requireAdmin,
  validateRequest({ body: insertProductSchema }),
  async (req, res) => {
    const auditContext = getAuditContext(req);
    const result = await adminService.createProduct(auditContext, req.body as InsertProduct);

    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * GET /api/admin/products/check-slug
 * Verify slug availability
 */
router.get("/check-slug", authService.requireAdmin, async (req, res) => {
  const slugQuery = z
    .object({
      slug: z
        .string()
        .min(1)
        .max(200)
        .transform((s) => s.toLowerCase()),
      excludeId: z.coerce.number().int().positive().optional(),
    })
    .parse(req.query);

  const result = await adminService.checkSlugAvailability(slugQuery.slug, slugQuery.excludeId);

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * GET /api/admin/products/:id
 * Retrieve single product with full relations
 */
router.get("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const result = await adminService.getProductById(id);

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * PATCH /api/admin/products/:id
 * Partial product update
 */
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertProductSchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return;

    const auditContext = getAuditContext(req);
    const result = await adminService.updateProduct(
      auditContext,
      id,
      req.body as Partial<InsertProduct>,
    );

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * PUT /api/admin/products/:id
 * Full product update
 */
router.put(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertProductSchema }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return;
    const auditContext = getAuditContext(req);
    const result = await adminService.updateProduct(auditContext, id, req.body as InsertProduct);

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * POST /api/admin/products/:id/restore
 * Restore soft-deleted product
 */
router.post("/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;

  const auditContext = getAuditContext(req);
  const result = await adminService.restoreProduct(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * DELETE /api/admin/products/:id
 * Soft delete product
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.softDeleteProduct(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * DELETE /api/admin/products/:id/hard
 * Permanent product deletion
 */
router.delete(
  "/:id/hard",
  authService.requireAdmin,
  validateRequest({ body: hardDeleteSchema }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return;
    const confirm = req.body?.confirm as string;
    const auditContext = getAuditContext(req);
    const result = await adminService.hardDeleteProduct(auditContext, id, confirm);

    return result.match(
      () => res.json({ success: true }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

export default router;
