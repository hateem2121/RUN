import { Router } from "express";
import { adminLimiter } from "../../lib/resilience/rate-limiter.js";
import { enforceValidation } from "../../middleware/strict-validation.js";
import { authService } from "../../services/auth-service.js";
import adminRouter from "../admin/admin.js";
import debugRouter from "../debug.js";
import featureFlagsRouter from "../feature-flags.js";
import contactRouter from "../resources/contact.routes.js";
import logoSettingsRouter from "../resources/logo-settings.routes.js";
import navigationRouter from "../resources/navigation.routes.js";
import pageContentRouter from "../resources/page-content-routes.js";
import footerConfigRouter from "../utilities/footer-config.js";
import inquiryAdminRouter from "../utilities/inquiry-admin.js";

const router = Router();

// Protected Admin Routes — requireAdmin applied to admin-only routers
router.use(
  "/admin",
  authService.requireAdmin,
  adminLimiter.middleware(),
  enforceValidation,
  adminRouter,
);

// Admin-accessible utilities — all require admin authentication
router.use(authService.requireAdmin, inquiryAdminRouter);
router.use(authService.requireAdmin, footerConfigRouter);
router.use("/feature-flags", authService.requireAdmin, featureFlagsRouter);
router.use("/debug", authService.requireAdmin, debugRouter);

// Content Management — these contain mixed public GETs + admin-only mutations.
// Individual mutation endpoints (POST/PATCH/DELETE) have their own requireAdmin middleware.
// NOTE: resourceRouter is intentionally NOT mounted here — it is already mounted
// at the public level in routes/index.ts (line 93) to serve visitor-facing pages.
router.use(pageContentRouter);
router.use(navigationRouter);
router.use(contactRouter);
router.use(logoSettingsRouter);

export default router;
