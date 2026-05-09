import { type InsertProduct, insertProductSchema } from "@run-remix/shared";
import { type RequestHandler, Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { getAuditContext } from "../../middleware/request-context.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";

const router = Router();
const productsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
});
type ProductsQuery = z.infer<typeof productsQuerySchema>;

/**
 * GET /api/admin/products/initial-data
 * Batch data for product creation/editing
 */
router.get("/initial-data", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getInitialProductsData();

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
});

/**
 * GET /api/admin/products
 * List products with pagination and filtering
 */
router.get(
  "/",
  authService.requireAdmin,
  validateRequest({
    query: productsQuerySchema,
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

    if (result.isErr()) {
      throw result.error;
    }

    return res.json(result.value);
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

    if (result.isErr()) {
      throw result.error;
    }

    return res.status(201).json(result.value);
  },
);

/**
 * GET /api/admin/products/check-slug
 * Verify slug availability
 */
router.get("/check-slug", authService.requireAdmin, async (req, res) => {
  const slugQuery = z
    .object({
      slug: z.string().min(1).max(200),
      excludeId: z.coerce.number().int().positive().optional(),
    })
    .parse(req.query);

  const result = await adminService.checkSlugAvailability(slugQuery.slug, slugQuery.excludeId);

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
});

/**
 * GET /api/admin/products/:id
 * Retrieve single product with full relations
 */
router.get("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const result = await adminService.getProductById(id);

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
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

    if (result.isErr()) {
      throw result.error;
    }

    return res.json(result.value);
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

    if (result.isErr()) {
      throw result.error;
    }

    return res.json(result.value);
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

  if (result.isErr()) {
    throw result.error;
  }

  return res.json({ success: result.value });
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

  if (result.isErr()) {
    throw result.error;
  }

  return res.json({ success: result.value });
});

/**
 * DELETE /api/admin/products/:id/hard
 * Permanent product deletion
 */
router.delete("/:id/hard", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const confirm = req.body?.confirm as string;
  const auditContext = getAuditContext(req);
  const result = await adminService.hardDeleteProduct(auditContext, id, confirm);

  if (result.isErr()) {
    throw result.error;
  }

  return res.json({ success: result.value });
});

export default router;
