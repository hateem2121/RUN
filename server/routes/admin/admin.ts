/**
 * ADMIN MASTER ROUTER
 * Orchestrates sub-routers for administrative operations.
 */

import { Router } from "express";
import blogRouter from "./blog.routes.js";
import categoriesRouter from "./categories.routes.js";
import contentRouter from "./content.routes.js";
import manufacturingRouter from "./manufacturing.routes.js";
import productsRouter from "./products.routes.js";
import systemRouter from "./system.routes.js";

const router = Router();

/**
 * MOUNT SUB-ROUTERS
 * These routers handle domain-specific administrative logic.
 */

// Blog management: /api/admin/blog
router.use("/blog", blogRouter);

// Product management: /api/admin/products
router.use("/products", productsRouter);

// Categories management: /api/admin/categories
router.use("/categories", categoriesRouter);

// Manufacturing management: /api/admin/manufacturing
router.use("/manufacturing", manufacturingRouter);

// Content management: /api/admin/content
// Note: Some legacy frontend calls might expect /api/admin/certificates etc.
// If so, we can alias them here or mount contentRouter at the root.
router.use("/content", contentRouter);

// System management: /api/admin/system
router.use("/system", systemRouter);

/**
 * LEGACY COMPATIBILITY LAYER
 * Direct mounts for routes expected at the root of /api/admin
 */

// System root aliases
router.use("/", systemRouter); // Handles /media-assets, /cleanup, /test, /cache/stats, etc.

// Content root aliases
router.use("/", contentRouter); // Handles /certificates, /fibers, /about, etc.

// Products root aliases
router.use("/", productsRouter); // Handles /products, /products/:id, etc.

export default router;
