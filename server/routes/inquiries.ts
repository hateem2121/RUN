import { Router } from "express";
import { z } from "zod";
import { products } from "../seeds/products.js";

const router = Router();

// --- Schemas ---

const inquirySchema = z.object({
  contact: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().min(2, "Company name is required"),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .min(1, "At least one item must be added to the quote"),
});

// --- Endpoints ---

// Product routes moved to core/products.ts
// router.get("/products", ...);
// router.get("/products/:id", ...);

// POST /api/inquiries
// prettier-ignore
router.post("/inquiries", (req, res) => {
  // security (public)
  try {
    const validatedData = inquirySchema.parse(req.body);

    // Logic: Log to DB (Mocked)
    // biome-ignore lint/suspicious/noConsole: Log payload
    console.log("[Inquiry Received]", {
      timestamp: new Date().toISOString(),
      ...validatedData,
    });

    // Mock Email Send
    // biome-ignore lint/suspicious/noConsole: Mock email
    console.log(`[Email Mock] Sending quote confirmation to ${validatedData.contact.email}`);

    res.status(201).json({
      success: true,
      message: "Quote request received successfully",
      inquiryId: `INQ-${Date.now()}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.message,
      });
    } else {
      // biome-ignore lint/suspicious/noConsole: Log error for internal tracking
      console.error("Inquiry Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export const inquiryRoutes = router;
