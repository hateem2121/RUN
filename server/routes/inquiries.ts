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

// GET /api/products
// Supports cursor-based pagination
router.get("/products", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const cursor = parseInt(req.query.cursor as string) || 0;
  const category = req.query.category as string;

  let filteredProducts = products;

  if (category) {
    filteredProducts = products.filter((p) => p.category === category);
  }

  // Determine slice
  // In a real DB, we would use WHERE id > cursor LIMIT limit
  // Here for array mock, we'll just slice by index for simplicity if cursor isn't ID based,
  // OR treat cursor as the ID of the last item seen.
  // Let's treat cursor as the last seen ID.

  const startIndex = cursor > 0 ? filteredProducts.findIndex((p) => p.id === cursor) + 1 : 0;

  const items = filteredProducts.slice(startIndex, startIndex + limit);
  const nextItem = filteredProducts[startIndex + limit];
  const nextCursor = nextItem ? nextItem.id : null;

  res.json({
    items,
    nextCursor,
    total: filteredProducts.length,
  });
});

// GET /api/products/:id
router.get("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json(product);
});

// POST /api/inquiries
router.post("/inquiries", (req, res) => {
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
