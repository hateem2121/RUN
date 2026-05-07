import { insertNewsletterSubscriberSchema } from "@run-remix/shared";
import type { Express } from "express";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";

export function registerNewsletterRoutes(app: Express): void {
  app.post("/api/newsletter/subscribe", async (req, res) => {
    const result = insertNewsletterSubscriberSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: result.error.issues[0]?.message || "Invalid email address.",
      });
    }

    await miscRepository.subscribeToNewsletter(result.data.email);

    return res.json({
      status: "success",
      message: "You have been subscribed!",
    });
  });

  logger.info("[Routes] Registered newsletter routes");
}
