/**
 * INQUIRY ROUTES
 * Handles public inquiry form submissions from the footer
 */

import express from "express";
import { z } from "zod";
import { insertInquirySchema } from "../../shared/schema.js";
import { logger } from "../lib/monitoring/logger.js";
import { getStorage } from "../lib/storage-singleton.js";

const router = express.Router();

// Schema matching the frontend payload from Footer.tsx
const footerInquirySchema = z.object({
  contact: z.object({
    company: z.string().optional(),
    email: z.string().email(),
    projectDescription: z.string(),
  }),
  items: z.array(z.any()).optional(),
  source: z.string().optional(),
});

router.post("/inquiries", async (req, res) => {
  try {
    const payload = footerInquirySchema.parse(req.body);
    const storage = getStorage();

    // Transform payload to match InsertInquiry schema
    const inquiryData = {
      name: payload.contact.company || "Footer Inquiry", // Fallback for required name
      email: payload.contact.email,
      company: payload.contact.company,
      message: payload.contact.projectDescription,
      source: payload.source || "footer_form",
      status: "new",
      // Optional defaults
      phone: null,
      country: null,
      preferredPlatform: null
    };

    const inquiry = await storage.createInquiry(inquiryData);

    logger.info(`[Inquiries] Created new inquiry #${inquiry.id} from ${inquiry.email}`);

    res.json({ success: true, inquiryId: inquiry.id });
  } catch (error) {
    logger.error("[Inquiries] Failed to create inquiry:", error);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

export const inquiryRoutes = router;
