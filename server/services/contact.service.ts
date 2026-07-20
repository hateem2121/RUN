import type { ContactPageConfiguration, InsertContactPageConfiguration } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { miscRepository } from "./repositories/index.js";

interface BusinessLocation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Service for managing Contact Page configuration
 */
class ContactService {
  /**
   * Retrieves the contact page configuration
   */
  async getContactPageConfiguration(): Promise<Result<ContactPageConfiguration, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<ContactPageConfiguration, AppError>> => {
        const config = await withCircuit(
          "get-contact-config",
          () => miscRepository.getContactPageConfiguration(),
          DB_CIRCUIT_OPTIONS,
        );

        if (!config) {
          return err(new NotFoundError("Contact page configuration"));
        }

        return ok(config);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ContactService] Failed to fetch contact configuration", error as Error);
        return err(new InternalError("Failed to fetch contact configuration", { error }));
      }),
    );
  }

  /**
   * Creates a new contact page configuration
   */
  async createContactPageConfiguration(
    data: InsertContactPageConfiguration,
  ): Promise<Result<ContactPageConfiguration, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<ContactPageConfiguration, AppError>> => {
        const created = await withCircuit(
          "create-contact-config",
          () => miscRepository.createContactPageConfiguration(data),
          DB_CIRCUIT_OPTIONS,
        );

        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ContactService] Failed to create contact configuration", error as Error);
        return err(new InternalError("Failed to create contact configuration", { error }));
      }),
    );
  }

  /**
   * Updates existing contact page configuration
   */
  async updateContactPageConfiguration(
    id: number,
    data: Partial<InsertContactPageConfiguration>,
  ): Promise<Result<ContactPageConfiguration, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<ContactPageConfiguration, AppError>> => {
        const updated = await withCircuit(
          "update-contact-config",
          () => miscRepository.updateContactPageConfiguration(id, data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          return err(new NotFoundError(`Contact configuration with ID ${id}`));
        }

        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error(
          "[ContactService] Failed to update contact configuration",
          { id },
          error as Error,
        );
        return err(new InternalError("Failed to update contact configuration", { id, error }));
      }),
    );
  }

  /**
   * Retrieves business locations
   * Extracted from route handler to maintain thin controller pattern (AS-108).
   */
  async getBusinessLocations(): Promise<Result<BusinessLocation[], AppError>> {
    const locations = [
      {
        id: 1,
        name: "Head Office",
        address: "Colombo, Sri Lanka",
        lat: 6.9271,
        lng: 79.8612,
      },
    ];
    return ok(locations);
  }
}

export const contactService = new ContactService();
