import { insertNewsletterSubscriberSchema } from "@run-remix/shared";
import type { Express } from "express";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { apiTier, criticalTier, publicTier } from "../../middleware/rate-limit-tiers.js";
import { newsletterService } from "../../services/newsletter.service.js";

export function registerNewsletterRoutes(app: Express): void {
  app.post("/api/newsletter/subscribe", criticalTier, async (req, res) => {
    const result = insertNewsletterSubscriberSchema.safeParse(req.body);

    if (!result.success) {
      throw new ValidationError("Invalid subscription data", {
        details: result.error.issues,
      });
    }

    const subscribeResult = await newsletterService.subscribe(result.data.email);

    if (subscribeResult.isErr()) {
      throw subscribeResult.error;
    }

    return res.status(201).json({
      status: "success",
      message: "You have been subscribed!",
    });
  });

  logger.info("[Routes] Registered newsletter routes");
}
