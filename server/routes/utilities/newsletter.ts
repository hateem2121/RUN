import { insertNewsletterSubscriberSchema } from "@run-remix/shared";
import type { Express } from "express";
import { validateRequest } from "zod-express-middleware";
import { logger } from "../../lib/monitoring/logger.js";
import { criticalTier } from "../../middleware/rate-limit-tiers.js";
import { newsletterService } from "../../services/newsletter.service.js";

export function registerNewsletterRoutes(app: Express): void {
  app.post(
    "/api/newsletter/subscribe",
    criticalTier,
    validateRequest({ body: insertNewsletterSubscriberSchema }),
    async (req, res) => {
      const { email } = req.body;
      const subscribeResult = await newsletterService.subscribe(email);

      return subscribeResult.match(
        () =>
          res.status(201).json({
            status: "success",
            message: "You have been subscribed!",
          }),
        (error) => res.status(error.statusCode || 500).json({ error: error.message }),
      );
    },
  );

  logger.info("[Routes] Registered newsletter routes");
}
