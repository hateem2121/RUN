import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { insertWebhookSubscriptionSchema } from "../../../shared/schema.js";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
import { webhookRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// OpenAPI Registration
registry.registerPath({
  method: "get",
  path: "/webhooks",
  summary: "List webhook subscriptions",
  tags: ["Webhooks"],
  security: [{ bearerAuth: [] }, { sessionAuth: [] }],
  responses: {
    200: jsonResponse(z.array(z.any()), "List of active webhook subscriptions"),
  },
});

registry.registerPath({
  method: "post",
  path: "/webhooks",
  summary: "Create a webhook subscription",
  tags: ["Webhooks"],
  security: [{ bearerAuth: [] }, { sessionAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertWebhookSubscriptionSchema,
        },
      },
    },
  },
  responses: {
    201: jsonResponse(z.any(), "The created webhook subscription"),
  },
});

// GET /api/webhooks - List subscriptions
router.get("/webhooks", authService.requireAdmin, async (_req, res) => {
  try {
    const subscriptions = await webhookRepository.getWebhookSubscriptions();
    return res.json({ success: true, data: subscriptions });
  } catch (error) {
    logger.error("Failed to fetch webhooks:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/webhooks - Create subscription
router.post("/webhooks", authService.requireAdmin, async (req, res) => {
  try {
    const validated = insertWebhookSubscriptionSchema.parse(req.body);
    const secret = crypto.randomBytes(32).toString("hex");

    const subscription = await webhookRepository.createWebhookSubscription({
      ...validated,
      secret,
    });

    return res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues });
    }
    logger.error("Failed to create webhook:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
