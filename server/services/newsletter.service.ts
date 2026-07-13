import { type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { miscRepository } from "./repositories/index.js";

/**
 * Service for managing newsletter subscriptions
 */
class NewsletterService {
  /**
   * Subscribes an email to the newsletter
   */
  async subscribe(email: string): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const result = await withCircuit(
          "newsletter-subscribe",
          () => miscRepository.subscribeToNewsletter(email),
          DB_CIRCUIT_OPTIONS,
        );

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[NewsletterService] Failed to subscribe to newsletter",
          { email },
          error as Error,
        );
        return new InternalError("Failed to subscribe to newsletter", { email, error });
      },
    );
  }
}

export const newsletterService = new NewsletterService();
