/**
 * ADMIN ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all administrative operations, cleanup, and system management
 */

import { Router } from "express";
import { z } from "zod";
import type { MediaAsset, Product } from "../../../shared/schema.js";
import { getLifecycleScheduler } from "../../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import { adminService } from "../../services/admin-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/media-assets - List all media assets (admin only)
router.get("/media-assets", authService.requireAdmin, async (_req, res) => {
  const mediaAssets = await withTimeout(
    getStorage().getMediaAssets(),
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

const emptyBodySchema = z.strictObject({}); // For routes that should not accept any body data

// GET /products/initial-data - Admin products batch data
router.get("/products/initial-data", authService.requireAdmin, async (_req, res) => {
  const data = await adminService.getInitialProductsData();
  return res.json(data);
});

// GET /test - API routing test endpoint
router.get("/test", authService.requireAdmin, (_req, res) => {
  return res.json({ message: "API routing works", timestamp: new Date() });
});

// POST /fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
router.post("/fix-corrupted-media", authService.requireAdmin, async (req, res) => {
  // security
  emptyBodySchema.parse(req.body);
  const result = await adminService.fixCorruptedMedia();
  
  return res.json({
    success: true,
    message: `Corrupted media cleanup completed: ${result.fixedCount} categories fixed`,
    ...result,
    timestamp: Date.now(),
  });
});

// POST /api/admin/cleanup/trigger - Trigger storage cleanup
router.post("/cleanup/trigger", authService.requireAdmin, async (req, res) => {
  const { autoClean } = req.body;
  const report = await adminService.triggerCleanup(autoClean === true);
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
router.post("/enterprise/audit-config", authService.requireAdmin, async (req, res) => {
  // security
  const validatedData = auditConfigSchema.parse(req.body);
  const { enabled, trackedTables } = validatedData;
  if (typeof enabled === "boolean") {
    getStorage().setAuditTrailEnabled(enabled);
  }
  if (Array.isArray(trackedTables)) {
    getStorage().configureTrackedTables(trackedTables);
  }
  return res.json({ success: true, message: "Audit configuration updated" });
});

// Restore endpoints
// prettier-ignore
router.post("/categories/:id/restore", authService.requireAdmin, async (req, res) => {
  // security
  emptyBodySchema.parse(req.body); // Validate no body data expected
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) {
    return; // Error response already sent
  }

  const result = await withTimeout(getStorage().restoreCategory(id), 5000, "Restore category");
  return res.json({ success: result });
});

// prettier-ignore
router.post("/products/:id/restore", authService.requireAdmin, async (req, res) => {
  // security
  emptyBodySchema.parse(req.body); // Validate no body data expected
  const id = validateIdParam(req, res, "id", "product");
  if (id === null) {
    return; // Error response already sent
  }

  const result = await withTimeout(getStorage().restoreProduct(id), 5000, "Restore product");
  return res.json({ success: result });
});

// prettier-ignore
router.post("/media-assets/:id/restore", authService.requireAdmin, async (req, res) => {
  // security
  emptyBodySchema.parse(req.body); // Validate no body data expected
  const id = validateIdParam(req, res, "id", "media asset");
  if (id === null) {
    return; // Error response already sent
  }

  const result = await withTimeout(getStorage().restoreMediaAsset(id), 5000, "Restore media asset");
  return res.json({ success: result });
});

export default router;
