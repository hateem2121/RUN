import type { Accessory, InsertAccessory } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { accessoryRepository } from "./repositories/index.js";

/**
 * Service for managing Accessory domain data
 * Enforces Result-based patterns and circuit breaker protection
 */
class AccessoryService {
  /**
   * Retrieves paginated accessories
   */
  async getAccessories(
    limit = 100,
    offset = 0,
    filters?: { category?: string; search?: string },
  ): Promise<Result<{ accessories: Accessory[]; total: number }, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<{ accessories: Accessory[]; total: number }, AppError>> => {
        const result = await withCircuit(
          "get-accessories",
          () => accessoryRepository.getAccessoriesWithCount(limit, offset, filters),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(result);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to fetch accessories", error as Error);
        return err(new InternalError("Failed to fetch accessories", { error }));
      }),
    );
  }

  /**
   * Retrieves a single accessory by ID
   */
  async getAccessory(id: number): Promise<Result<Accessory, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Accessory, AppError>> => {
        const accessory = await withCircuit(
          `get-accessory-${id}`,
          () => accessoryRepository.getAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!accessory) {
          return err(new NotFoundError(`Accessory with ID ${id}`));
        }

        return ok(accessory);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to fetch accessory", { id }, error as Error);
        return err(new InternalError(`Failed to fetch accessory ${id}`, { error }));
      }),
    );
  }

  /**
   * Creates a new accessory
   */
  async createAccessory(data: InsertAccessory): Promise<Result<Accessory, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Accessory, AppError>> => {
        const created = await withCircuit(
          "create-accessory",
          () => accessoryRepository.createAccessory(data),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to create accessory", error as Error);
        return err(new InternalError("Failed to create accessory", { error }));
      }),
    );
  }

  /**
   * Updates an existing accessory
   */
  async updateAccessory(
    id: number,
    data: Partial<InsertAccessory>,
  ): Promise<Result<Accessory, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Accessory, AppError>> => {
        const updated = await withCircuit(
          `update-accessory-${id}`,
          () => accessoryRepository.updateAccessory(id, data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          return err(new NotFoundError(`Accessory with ID ${id}`));
        }

        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to update accessory", { id }, error as Error);
        return err(new InternalError(`Failed to update accessory ${id}`, { error }));
      }),
    );
  }

  /**
   * Deletes an accessory (soft delete)
   */
  async deleteAccessory(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const success = await withCircuit(
          `delete-accessory-${id}`,
          () => accessoryRepository.deleteAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          return err(new NotFoundError(`Accessory with ID ${id}`));
        }

        if (success.isErr()) return err(success.error as any);
        return ok(success.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to delete accessory", { id }, error as Error);
        return err(new InternalError(`Failed to delete accessory ${id}`, { error }));
      }),
    );
  }

  /**
   * Restores a deleted accessory
   */
  async restoreAccessory(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const success = await withCircuit(
          `restore-accessory-${id}`,
          () => accessoryRepository.restoreAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          return err(new NotFoundError(`Accessory with ID ${id}`));
        }

        return ok(success);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AccessoryService] Failed to restore accessory", { id }, error as Error);
        return err(new InternalError(`Failed to restore accessory ${id}`, { error }));
      }),
    );
  }
}

export const accessoryService = new AccessoryService();
