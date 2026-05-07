import { addInquiryLogSchema, type InsertInquiry, insertInquirySchema } from "@run-remix/shared";
import express from "express";
import { inquiryService } from "../../services/inquiry-service.js";

const router = express.Router();

const updateInquirySchema = insertInquirySchema.partial();

router.get("/admin/inquiries", async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;
  const source = req.query.source as string | undefined;
  const search = req.query.search as string | undefined;

  const response = await inquiryService.listInquiries({
    page,
    limit,
    status: status || undefined,
    source: source || undefined,
    search: search || undefined,
  });

  return res.json(response);
});

router.get("/admin/inquiries/stats", async (_req, res) => {
  const result = await inquiryService.getStats();
  if (result.fromCache) {
    res.setHeader("X-Cache-Hit", "true");
  }
  return res.json(result.data);
});

router.get("/admin/inquiries/:id", async (req, res) => {
  const id = parseInt(req.params.id!, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid inquiry ID" });
  }

  const result = await inquiryService.getInquiryById(id);
  if (!result) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  if (result.fromCache) {
    res.setHeader("X-Cache-Hit", "true");
  }
  return res.json(result.data);
});

router.patch("/admin/inquiries/:id", async (req, res) => {
  const id = parseInt(req.params.id!, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid inquiry ID" });
  }

  const validatedData = updateInquirySchema.parse(req.body);
  const updated = await inquiryService.updateInquiry(id, validatedData as Partial<InsertInquiry>);

  if (!updated) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  return res.json(updated);
});

router.post("/admin/inquiries/:id/logs", async (req, res) => {
  const id = parseInt(req.params.id!, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid inquiry ID" });
  }

  const validation = addInquiryLogSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues });
  }

  const updated = await inquiryService.addCrmLog(id, {
    ...validation.data,
    user: (req as unknown as { user?: { email?: string } }).user?.email || "Admin",
  });

  if (!updated) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  return res.json(updated);
});

router.delete("/admin/inquiries/:id", async (req, res) => {
  const id = parseInt(req.params.id!, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid inquiry ID" });
  }

  const success = await inquiryService.deleteInquiry(id);
  if (!success) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  return res.json({ success: true, message: "Inquiry deleted successfully" });
});

export default router;
