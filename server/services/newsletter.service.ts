import { err, ok, type Result } from "neverthrow";
import { miscRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * Service for managing newsletter subscriptions
 */
export class NewsletterService {
  /**
   * Subscribes an email to the newsletter
   */
  async subscribe(email: string): Promise<Result<boolean, AppError>> {
    try {
      const result = await withCircuit(
        "newsletter-subscribe",
        () => miscRepository.subscribeToNewsletter(email),
        DB_CIRCUIT_OPTIONS,
      );

      return ok(result);
    } catch (error) {
      logger.error(
        "[NewsletterService] Failed to subscribe to newsletter",
        { email },
        error as Error,
      );
      return err(new InternalError("Failed to subscribe to newsletter", { email, error }));
    }
  }
}

export const newsletterService = new NewsletterService();
