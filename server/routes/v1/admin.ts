import { Router } from "express";
import { adminLimiter } from "../../lib/resilience/rate-limiter.js";
import { enforceValidation } from "../../middleware/strict-validation.js";
import { authService } from "../../services/auth-service.js";
import adminRouter from "../admin/admin.js";
import debugRouter from "../debug.js";
import featureFlagsRouter from "../feature-flags.js";
import contentManagementRouter from "../resources/content-management-routes.js";
import resourceRouter from "../resources/index.js";
import pageContentRouter from "../resources/page-content-routes.js";
import footerConfigRouter from "../utilities/footer-config.js";
import inquiryAdminRouter from "../utilities/inquiry-admin.js";

const router = Router();

// Protected Admin Routes
router.use("/admin", authService.requireAdmin, adminLimiter.middleware(), enforceValidation);
router.use(adminRouter);

// Admin-accessible utilities
router.use(inquiryAdminRouter);
router.use(footerConfigRouter);
router.use("/feature-flags", featureFlagsRouter);
router.use("/debug", debugRouter);

// Content Management
router.use(pageContentRouter);
router.use(contentManagementRouter);
router.use(resourceRouter);

export default router;
