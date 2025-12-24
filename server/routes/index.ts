/**
 * MASTER ROUTER - Route Orchestration & Documentation
 *
 * FOLDER STRUCTURE (Domain-Driven Organization - CHUNK 14):
 * - core/         : 8 files - Business entities (products, categories, fabrics, accessories, certificates, materials, size-charts, taxonomy)
 * - admin/        : 2 files - Admin panel operations and authentication
 * - utilities/    : 8 files - Diagnostics, metrics, health checks, migrations, data creation (includes 2 population files: direct-postgres, api-based)
 * - resources/    : 24 files - CMS content resources (homepage, about, contact, sustainability, manufacturing, technology - includes 2 CMS files: page-content, content-management)
 * - media/        : 1 folder module - Media upload, processing, delivery, batch operations (includes folder-management.routes.ts)
 *
 * LEGACY FILES: Zero files in root (all organized by domain)
 *
 * RATE LIMITING (CHUNK 13):
 * - General API (/api/*): 100 requests per 15 minutes
 * - Admin Endpoints (/api/admin/*): 30 requests per 15 minutes
 * - Diagnostics (/api/kv-direct/*, /api/kv-diagnostics/*): 10 requests per 1 minute
 *
 * TYPE SAFETY:
 * - Strict mode enabled for all route files (tsconfig.base.json)
 * - Zod validation on all request bodies
 * - Type-safe storage interfaces and database operations
 *
 * NAMING CONVENTIONS:
 * - resources/*.routes.ts  : Resource-oriented routers (e.g., about-hero.routes.ts, contact.routes.ts)
 * - (other folders)/*.ts   : All other route modules (e.g., products.ts, admin.ts, metrics.ts)
 *
 * EXPORT PATTERN:
 * - All route files export default Express Router: `export default router;`
 * - Utility routes use named exports: `export function registerMetricsRoutes(app: Express)`
 *
 * CACHE POLICY:
 * - TTL Constants: CACHE_TTL_STATIC=1800s, CACHE_TTL_NAVIGATION=900s, CACHE_TTL_BATCH=600s
 * - Admin Bypass: shouldBypassCache() checks referer header (/admin) or ?nocache=true query param
 * - Cache Invalidation: L1 (React Query) + L2 (Replit KV) cleared after mutations
 *
 * API STRUCTURE: Flat routes at /api/* (e.g., /api/products, /api/homepage-hero, /api/health/db)
 */

import compression from "compression";
import type { Express } from "express";
import { createServer, type Server } from "http";
// Import authentication modules
import { isAuthenticated, setupAuth } from "../googleAuth.js";
import { adminLimiter, diagnosticLimiter } from "../lib/rate-limiter.js";
import { logger } from "../lib/smart-logger.js";
import { getStorage } from "../lib/storage-singleton.js";
import {
	clearAdminCacheHandler,
	getAdminCacheStatsHandler,
	requireAdmin,
} from "../middleware/auth.js";
import { enforceValidation } from "../middleware/strict-validation.js";
import adminRouter from "./admin/admin.js";
import accessoriesRouter from "./core/accessories.js";
// Import distributed route modules
import categoriesRouter from "./core/categories.js";
import certificatesRouter from "./core/certificates.js";
import fabricsRouter from "./core/fabrics.js";
import materialsRouter from "./core/materials.js";
import productsRouter from "./core/products.js";
import sizeChartsRouter from "./core/size-charts.js";
// Import utility/diagnostic routes
import { registerTaxonomyRoutes } from "./core/taxonomy-routes.js";
import featureFlagsRouter from "./feature-flags.js";
import { inquiryRoutes } from "./inquiries.js";
import foldersRouter from "./media/folder-management.routes.js";
// Import media routes
import mediaRoutes from "./media/index.js";
import contentManagementRouter from "./resources/content-management-routes.js";
// Import modular resource routes (PHASE 3.3: Modular Resource Routers)
// Now includes homepage and contact routes (relocated from modules/ on October 15, 2025)
import resourceRouter from "./resources/index.js";
import pageContentRouter from "./resources/page-content-routes.js";
import { registerAPIBasedPopulationRoutes } from "./utilities/api-based-population.js";
import { registerDataCreationRoutes } from "./utilities/data-creation.js";
import { registerDirectPostgresPopulationRoutes } from "./utilities/direct-postgres-population.js";
import footerConfigRouter from "./utilities/footer-config.js";
import inquiryAdminRouter from "./utilities/inquiry-admin.js";
import { registerKVDiagnosticsRoutes } from "./utilities/kv-diagnostics.js";
import { registerMetricsRoutes } from "./utilities/metrics.js";
import { registerMigrationExecutionRoutes } from "./utilities/migration-execution.js";
import workerRouter from "./worker.js";

export async function registerRoutes(app: Express): Promise<Server> {
	// Initialize HTTP server
	const httpServer = createServer(app);

	// ============================================================================
	// AUTHENTICATION SETUP (MUST BE FIRST)
	// Reference: https://developers.google.com/identity/protocols/oauth2
	// ✓ CHECKPOINT: PHASE-4-ROUTES-INTEGRATED
	// ============================================================================
	await setupAuth(app);
	logger.info("[Auth] ✅ Google Auth initialized (OIDC + PostgreSQL sessions)");

	// Auth user endpoint - returns current user with admin status
	app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
		try {
			const userId = req.user.claims.sub;
			const user = await getStorage().getUser(userId);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			// Return user with admin status for frontend
			return res.json({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				profileImageUrl: user.profileImageUrl,
				isAdmin: user.isAdmin,
			});
		} catch (error) {
			logger.error("[Auth] Error fetching user:", error);
			return res.status(500).json({ message: "Failed to fetch user" });
		}
	});

	// TEMPORARY: Dev Login Route for Testing
	// Allows browser subagent to establish admin session without Google OAuth
	app.get("/api/dev/login", async (req, res) => {
		if (process.env.NODE_ENV === "production") {
			return res.status(404).send("Not found");
		}

		try {
			const { db } = await import("../db.js");
			const { users } = await import("../../shared/schema.js");
			const { eq } = await import("drizzle-orm");

			// Find the admin user we promoted
			const adminUser = await db.query.users.findFirst({
				where: eq(users.email, "team@wear-run.com"),
			});

			if (!adminUser) {
				return res.status(404).json({ error: "Admin user not found" });
			}

			// Manually establish session
			const user = {
				claims: {
					sub: adminUser.id,
					email: adminUser.email,
				},
			};

			return req.login(user, (err) => {
				if (err) {
					return res.status(500).json({ error: "Login failed" });
				}
				return res.json({ success: true, message: "Logged in as admin", user });
			});
		} catch (error) {
			return res.status(500).json({ error: String(error) });
		}
	});

	// Admin cache management endpoints (protected by requireAdmin)
	app.post("/api/admin/cache/clear", requireAdmin, clearAdminCacheHandler);
	app.get("/api/admin/cache/stats", requireAdmin, getAdminCacheStatsHandler);
	logger.info(
		"[Auth] ✅ Auth routes registered (/api/login, /api/logout, /api/auth/user)",
	);

	// Enable compression middleware for all routes
	app.use(
		compression({
			level: 6,
			threshold: 1024,
			filter: (_req, res) => {
				if (res.get("Content-Type")?.includes("application/json")) return true;
				if (res.get("Content-Type")?.includes("text/")) return true;
				return false;
			},
		}),
	);

	logger.info("[Routes] Mounting API routes with flat structure (/api/*)");

	// ============================================================================
	// CORE API ROUTES (Flat Structure: /api/resource)
	// ============================================================================

	// Core business entity routes
	app.use("/api", categoriesRouter);
	app.use("/api", productsRouter);
	app.use("/api", fabricsRouter);
	app.use("/api", accessoriesRouter);
	app.use("/api", certificatesRouter);
	app.use("/api", materialsRouter);
	app.use("/api", sizeChartsRouter);
	app.use("/api", inquiryRoutes);

	// Media management
	app.use("/api/media", mediaRoutes);
	app.use("/api", foldersRouter);

	// ============================================================================
	// ADMIN ROUTES (PROTECTED)
	// All /api/admin/* routes require admin authentication
	// ============================================================================

	// CRITICAL: Apply requireAdmin middleware to ALL /api/admin/* routes
	// This blocks non-admins (403) and redirects unauthenticated users (401)
	app.use("/api/admin", requireAdmin);
	app.use("/api/admin", adminLimiter.middleware()); // Rate limiting after auth
	app.use("/api/admin", enforceValidation); // CHUNK 8: Enforce strict validation
	app.use("/api", adminRouter);
	app.use("/api", inquiryAdminRouter);
	app.use(footerConfigRouter);
	app.use("/api/feature-flags", featureFlagsRouter);
	logger.info(
		"[Auth] ✅ Admin routes protected with requireAdmin + strict validation",
	);

	// Content management routes
	app.use("/api", pageContentRouter);
	app.use("/api", contentManagementRouter);

	// Worker routes (Cloud Tasks targets)
	app.use("/api", workerRouter);

	// PHASE 3.3: Modular Resource Routes (/api/*)
	// Now includes homepage and contact routes (relocated from modules/ on October 15, 2025)
	app.use("/api", resourceRouter);
	logger.info(
		"[Routes] ✅ Modular resource routes mounted at /api/* (includes homepage, contact, about, sustainability, manufacturing, technology)",
	);

	// ============================================================================
	// UTILITY & DIAGNOSTIC ROUTES
	// ============================================================================

	registerTaxonomyRoutes(app);
	registerMigrationExecutionRoutes(app);

	// CHUNK 13: Diagnostic routes with very strict rate limiting (10 req/1min)
	app.use("/api/kv-direct", diagnosticLimiter.middleware());
	app.use("/api/kv-diagnostics", diagnosticLimiter.middleware());
	registerKVDiagnosticsRoutes(app);
	registerMetricsRoutes(app);
	registerDataCreationRoutes(app);
	registerDirectPostgresPopulationRoutes(app);
	registerAPIBasedPopulationRoutes(app);

	logger.info("[Routes] ✅ All routes registered successfully");

	return httpServer;
}
