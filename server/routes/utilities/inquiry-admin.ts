import { addInquiryLogSchema, type InsertInquiry, insertInquirySchema } from "@run-remix/shared";
import express from "express";
import { ValidationError } from "../../lib/errors.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { inquiryService } from "../../services/inquiry-service.js";

const router = express.Router();

// SE-A01-01 FIX: Enforce admin RBAC on all inquiry management routes
router.use("/admin/inquiries", authService.requireAdmin);

const updateInquirySchema = insertInquirySchema.partial();

router.get("/admin/inquiries", async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;
  const source = req.query.source as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await inquiryService.listInquiries({
    page,
    limit,
    status: status || undefined,
    source: source || undefined,
    search: search || undefined,
  });

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/admin/inquiries/stats", async (_req, res) => {
  const result = await inquiryService.getStats();

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/admin/inquiries/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Inquiry");
  if (id === null) return;

  const result = await inquiryService.getInquiryById(id);

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/admin/inquiries/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Inquiry");
  if (id === null) return;

  const validation = updateInquirySchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid inquiry data", { issues: validation.error.issues });
  }

  const result = await inquiryService.updateInquiry(id, validation.data as Partial<InsertInquiry>);

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/admin/inquiries/:id/logs", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Inquiry");
  if (id === null) return;

  const validation = addInquiryLogSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid log data", { issues: validation.error.issues });
  }

  const result = await inquiryService.addCrmLog(id, {
    ...validation.data,
    user: (req as unknown as { user?: { email?: string } }).user?.email || "Admin",
  });

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/admin/inquiries/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Inquiry");
  if (id === null) return;

  const result = await inquiryService.deleteInquiry(id);

  return result.match(
    () => res.json({ success: true, message: "Inquiry deleted successfully" }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
