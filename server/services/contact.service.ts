import { err, ok, type Result } from "neverthrow";
import type {
  ContactPageConfiguration,
  InsertContactPageConfiguration,
} from "../../shared/index.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * Service for managing Contact Page configuration
 */
export class ContactService {
  /**
   * Retrieves the contact page configuration
   */
  async getContactPageConfiguration(): Promise<Result<ContactPageConfiguration, AppError>> {
    try {
      const config = await withCircuit(
        "get-contact-config",
        () => miscRepository.getContactPageConfiguration(),
        DB_CIRCUIT_OPTIONS,
      );

      if (!config) {
        return err(new NotFoundError("Contact page configuration"));
      }

      return ok(config);
    } catch (error) {
      logger.error("[ContactService] Failed to fetch contact configuration", error as Error);
      return err(new InternalError("Failed to fetch contact configuration", { error }));
    }
  }

  /**
   * Creates a new contact page configuration
   */
  async createContactPageConfiguration(
    data: InsertContactPageConfiguration,
  ): Promise<Result<ContactPageConfiguration, AppError>> {
    try {
      const created = await withCircuit(
        "create-contact-config",
        () => miscRepository.createContactPageConfiguration(data),
        DB_CIRCUIT_OPTIONS,
      );

      return ok(created);
    } catch (error) {
      logger.error("[ContactService] Failed to create contact configuration", error as Error);
      return err(new InternalError("Failed to create contact configuration", { error }));
    }
  }

  /**
   * Updates existing contact page configuration
   */
  async updateContactPageConfiguration(
    id: number,
    data: Partial<InsertContactPageConfiguration>,
  ): Promise<Result<ContactPageConfiguration, AppError>> {
    try {
      const updated = await withCircuit(
        "update-contact-config",
        () => miscRepository.updateContactPageConfiguration(id, data),
        DB_CIRCUIT_OPTIONS,
      );

      if (!updated) {
        return err(new NotFoundError(`Contact configuration with ID ${id}`));
      }

      return ok(updated);
    } catch (error) {
      logger.error(
        "[ContactService] Failed to update contact configuration",
        { id },
        error as Error,
      );
      return err(new InternalError("Failed to update contact configuration", { id, error }));
    }
  }
}

export const contactService = new ContactService();
