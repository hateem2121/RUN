/**
 * ADMIN ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all administrative operations, cleanup, and system management
 */

import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { mediaRepository } from "../../lib/db/repositories/index.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";
import { getAuditContext } from "../../utils/request-context.js";
import { validateIdParam } from "../../utils.js";
import blogRouter from "./blog.routes.js";

const router = Router();

// Mount Blog Router under /api/admin/blog
router.use("/blog", blogRouter);

// GET /api/media-assets - List all media assets (admin only)
router.get("/media-assets", authService.requireAdmin, async (_req, res) => {
  const mediaAssets = await withTimeout(
    mediaRepository.getMediaAssets(),
    5000,
    "Fetch all media assets",
  );
  return res.json(mediaAssets || []);
});

// Zod validation schemas for admin routes
const auditConfigSchema = z.object({
  enabled: z.boolean().optional(),
  trackedTables: z.array(z.string()).optional(),
});

const emptyBodySchema = z
  .object({
    timeout: z.number().optional(), // Allow optional timeout override
  })
  .strict();

// GET /products/initial-data - Admin products batch data
router.get("/products/initial-data", authService.requireAdmin, async (_req, res) => {
  const data = await adminService.getInitialProductsData();
  return res.json(data);
});

// GET /products - List products (admin only, includes unapproved/inactive)
router.get("/products", authService.requireAdmin, async (req, res) => {
  const { page, limit, search, categoryId, status } = req.query;

  // We could call a dedicated productService method here, but for now we'll
  // utilize the adminService which might have fetching logic or use a temporary implementation
  // A proper implementation would use a dedicated method in products.service.ts

  // NOTE: This relies on the new function being added to adminService or productService
  // For the moment, we'll try to fetch all products and manually filter/paginate
  // as a fallback if the specific method doesn't exist yet
  const result = await adminService.getProductsList({
    page: parseInt(page as string, 10) || 1,
    limit: parseInt(limit as string, 10) || 50,
    search: search as string,
    categoryId: categoryId as string,
    status: status as string,
  });

  return res.json(result);
});

// POST /products - Create product (admin only)
router.post("/products", authService.requireAdmin, async (req, res) => {
  const auditContext = getAuditContext(req);
  const result = await adminService.createProduct(auditContext, req.body);
  return res.status(201).json(result);
});

// PATCH /products/:id - Update product (admin only)
router.patch("/products/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;

  const auditContext = getAuditContext(req);
  const result = await adminService.updateProduct(auditContext, id, req.body);
  return res.json(result);
});

// GET /products/check-slug - Check slug availability
// IMPORTANT: This route MUST be before /products/:id to avoid catching "check-slug" as an :id param
router.get("/products/check-slug", authService.requireAdmin, async (req, res) => {
  const slug = req.query.slug as string;
  if (!slug) {
    return res.status(400).json({ error: "slug query parameter is required" });
  }
  const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string, 10) : undefined;
  const result = await adminService.checkSlugAvailability(slug, excludeId);
  return res.json(result);
});

// GET /products/:id - Single product with all relations
router.get("/products/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const product = await adminService.getProductById(id);
  return res.json(product);
});

// PUT /products/:id - Full update
router.put("/products/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.updateProduct(auditContext, id, req.body);
  return res.json(result);
});

// DELETE /products/:id - Soft delete (sets deletedAt)
router.delete("/products/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.softDeleteProduct(auditContext, id);
  return res.json({ success: result });
});

// DELETE /products/:id/hard - Permanent delete (requires { confirm: 'DELETE' })
router.delete("/products/:id/hard", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) return;
  const confirm = req.body?.confirm as string;
  const auditContext = getAuditContext(req);
  const result = await adminService.hardDeleteProduct(auditContext, id, confirm);
  return res.json({ success: result });
});

// GET /test - API routing test endpoint
router.get("/test", authService.requireAdmin, (_req, res) => {
  return res.json({ message: "API routing works", timestamp: new Date() });
});

// GET /dashboard/stats - Admin Dashboard aggregate metrics
router.get("/dashboard/stats", authService.requireAdmin, async (_req, res) => {
  const stats = await adminService.getDashboardStats();
  return res.json(stats);
});

// POST /fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
// POST /fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
router.post(
  "/fix-corrupted-media",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const { timeout } = req.body;

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.fixCorruptedMedia(auditContext, timeout);

    return res.json({
      success: true,
      message: `Corrupted media cleanup completed: ${result.fixedCount} categories fixed`,
      ...result,
      timestamp: Date.now(),
    });
  },
);

// POST /api/admin/cleanup/trigger - Trigger storage cleanup
router.post("/cleanup/trigger", authService.requireAdmin, async (req, res) => {
  const { autoClean, timeout } = req.body;

  // Create audit context
  const auditContext = getAuditContext(req);

  const report = await adminService.triggerCleanup(auditContext, autoClean === true, timeout);

  res.json({ success: true, report });
});

// GET /enterprise/audit-config - Audit configuration retrieval
router.get("/enterprise/audit-config", authService.requireAdmin, async (_req, res) => {
  return res.json({
    enabled: true,
    trackedTables: [
      "categories",
      "products",
      "mediaAssets",
      "fabrics",
      "fibers",
      "certificates",
      "sizeCharts",
      "accessories",
      "navigationItems",
      "footerLinks",
    ],
    retentionPeriods: { standard: 2555, high: 3650, critical: 7300 },
  });
});

// POST /enterprise/audit-config - Audit configuration update
// prettier-ignore
router.post(
  "/enterprise/audit-config",
  authService.requireAdmin,
  validateRequest({
    body: auditConfigSchema,
  }),
  async (req, res) => {
    const validatedData = req.body;

    // Create audit context
    const auditContext = getAuditContext(req);

    await adminService.updateAuditConfig(auditContext, validatedData);

    return res.json({ success: true, message: "Audit configuration updated" });
  },
);

// Restore endpoints
// prettier-ignore
router.post(
  "/categories/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreCategory(auditContext, id);

    return res.json({ success: result });
  },
);

// prettier-ignore
// prettier-ignore
router.post(
  "/products/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreProduct(auditContext, id);

    return res.json({ success: result });
  },
);

// prettier-ignore
router.post(
  "/media-assets/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "media asset");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreMediaAsset(auditContext, id);

    return res.json({ success: result });
  },
);

// =============================================================================
// CERTIFICATE MANAGEMENT
// =============================================================================

// GET /certificates - List all certificates
router.get("/certificates", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getCertificatesList();
  return res.json(result);
});

// POST /certificates - Create certificate
router.post("/certificates", authService.requireAdmin, async (req, res) => {
  const auditContext = getAuditContext(req);
  const result = await adminService.createCertificate(auditContext, req.body);
  return res.status(201).json(result);
});

// PATCH /certificates/:id - Update certificate
router.patch("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.updateCertificate(auditContext, id, req.body);
  return res.json(result);
});

// DELETE /certificates/:id - Delete certificate
router.delete("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteCertificate(auditContext, id);
  return res.json({ success: result });
});

// =============================================================================
// FIBER MANAGEMENT
// =============================================================================

// GET /fibers - List all fibers
router.get("/fibers", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getFibersList();
  return res.json(result);
});

// POST /fibers - Create fiber
router.post("/fibers", authService.requireAdmin, async (req, res) => {
  const auditContext = getAuditContext(req);
  const result = await adminService.createFiber(auditContext, req.body);
  return res.status(201).json(result);
});

// PATCH /fibers/:id - Update fiber
router.patch("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.updateFiber(auditContext, id, req.body);
  return res.json(result);
});

// DELETE /fibers/:id - Delete fiber
router.delete("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteFiber(auditContext, id);
  return res.json({ success: result });
});

// =============================================================================
// ABOUT TIMELINE MANAGEMENT
// =============================================================================

// GET /about/timeline - List all entries
router.get("/about/timeline", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getAboutTimelineEntries();
  return res.json(result);
});

// POST /about/timeline - Create entry
router.post("/about/timeline", authService.requireAdmin, async (req, res) => {
  const auditContext = getAuditContext(req);
  const result = await adminService.createAboutTimelineEntry(auditContext, req.body);
  return res.status(201).json(result);
});

// PATCH /about/timeline/:id - Update entry
router.patch("/about/timeline/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "timeline entry");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.updateAboutTimelineEntry(auditContext, id, req.body);
  return res.json(result);
});

// DELETE /about/timeline/:id - Delete entry
router.delete("/about/timeline/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "timeline entry");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteAboutTimelineEntry(auditContext, id);
  return res.json({ success: result });
});

export default router;
