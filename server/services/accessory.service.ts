import type { Accessory, InsertAccessory } from "@run-remix/shared";
import { type Result, ResultAsync } from "neverthrow";
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
    return ResultAsync.fromPromise(
      (async (): Promise<{ accessories: Accessory[]; total: number }> => {
        const result = await withCircuit(
          "get-accessories",
          () => accessoryRepository.getAccessoriesWithCount(limit, offset, filters),
          DB_CIRCUIT_OPTIONS,
        );
        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to fetch accessories", error as Error);
        return new InternalError("Failed to fetch accessories", { error });
      },
    );
  }

  /**
   * Retrieves a single accessory by ID
   */
  async getAccessory(id: number): Promise<Result<Accessory, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Accessory> => {
        const accessory = await withCircuit(
          `get-accessory-${id}`,
          () => accessoryRepository.getAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!accessory) {
          throw new NotFoundError(`Accessory with ID ${id}`);
        }

        return accessory;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to fetch accessory", { id }, error as Error);
        return new InternalError(`Failed to fetch accessory ${id}`, { error });
      },
    );
  }

  /**
   * Creates a new accessory
   */
  async createAccessory(data: InsertAccessory): Promise<Result<Accessory, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Accessory> => {
        const created = await withCircuit(
          "create-accessory",
          () => accessoryRepository.createAccessory(data),
          DB_CIRCUIT_OPTIONS,
        );
        return created;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to create accessory", error as Error);
        return new InternalError("Failed to create accessory", { error });
      },
    );
  }

  /**
   * Updates an existing accessory
   */
  async updateAccessory(
    id: number,
    data: Partial<InsertAccessory>,
  ): Promise<Result<Accessory, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Accessory> => {
        const updated = await withCircuit(
          `update-accessory-${id}`,
          () => accessoryRepository.updateAccessory(id, data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          throw new NotFoundError(`Accessory with ID ${id}`);
        }

        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to update accessory", { id }, error as Error);
        return new InternalError(`Failed to update accessory ${id}`, { error });
      },
    );
  }

  /**
   * Deletes an accessory (soft delete)
   */
  async deleteAccessory(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const success = await withCircuit(
          `delete-accessory-${id}`,
          () => accessoryRepository.deleteAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          throw new NotFoundError(`Accessory with ID ${id}`);
        }

        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to delete accessory", { id }, error as Error);
        return new InternalError(`Failed to delete accessory ${id}`, { error });
      },
    );
  }

  /**
   * Restores a deleted accessory
   */
  async restoreAccessory(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const success = await withCircuit(
          `restore-accessory-${id}`,
          () => accessoryRepository.restoreAccessory(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          throw new NotFoundError(`Accessory with ID ${id}`);
        }

        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AccessoryService] Failed to restore accessory", { id }, error as Error);
        return new InternalError(`Failed to restore accessory ${id}`, { error });
      },
    );
  }
}

export const accessoryService = new AccessoryService();
