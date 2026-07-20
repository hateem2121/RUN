import type { InsertService, Service } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { servicesRepository } from "./repositories/index.js";

const DEFAULT_SERVICES: Service[] = [
  {
    id: 1,
    iconName: "Cpu",
    title: "High-Performance Manufacturing",
    description:
      "State-of-the-art automated production processes delivering exceptional precision and speed.",
    features: [
      "Automated assembly lines",
      "Real-time quality tracking",
      "Custom specification options",
    ],
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    iconName: "Leaf",
    title: "Sustainable Sourcing",
    description: "Fully certified eco-friendly materials and carbon-neutral supply chain options.",
    features: [
      "Organic fiber choices",
      "Recycled materials integration",
      "Waste minimization protocol",
    ],
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    iconName: "Shield",
    title: "Quality Assurance",
    description: "Rigorous testing protocols and end-to-end certification compliance audits.",
    features: [
      "ISO 9001 certification",
      "Destructive & non-destructive testing",
      "Traceability guarantee",
    ],
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class ServicesService {
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateServices?.();
    } catch (error) {
      logger.error("[ServicesService] Cache invalidation failed", error as Error);
    }
  }

  async getServices(includeInactive = false): Promise<Result<Service[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Service[], AppError>> => {
        const list = await withCircuit(
          "get-services",
          () => servicesRepository.getServices(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );

        if (!list || list.length === 0) {
          const fallbacks = includeInactive
            ? DEFAULT_SERVICES
            : DEFAULT_SERVICES.filter((s) => s.isActive);
          return ok(fallbacks);
        }

        return ok(list);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Failed to fetch services", { error }));
      }),
    ).orElse((error) => {
      logger.error("[ServicesService] Failed to fetch services", error as Error);
      const fallbacks = includeInactive
        ? DEFAULT_SERVICES
        : DEFAULT_SERVICES.filter((s) => s.isActive);
      return ok(fallbacks); // Fallback instead of failing
    });
  }

  async getService(id: number): Promise<Result<Service, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Service, AppError>> => {
        const service = await withCircuit(
          `get-service-${id}`,
          () => servicesRepository.getService(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!service) {
          const fallback = DEFAULT_SERVICES.find((s) => s.id === id);
          if (!fallback) {
            return err(new NotFoundError(`Service with ID ${id}`));
          }
          return ok(fallback);
        }

        return ok(service);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError(`Failed to fetch service ${id}`, { error }));
      }),
    ).orElse((error) => {
      logger.error("[ServicesService] Failed to fetch service", { id }, error as Error);
      const fallback = DEFAULT_SERVICES.find((s) => s.id === id);
      if (!fallback) {
        return err(error);
      }
      return ok(fallback);
    });
  }

  async createService(data: InsertService): Promise<Result<Service, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Service, AppError>> => {
        const created = await withCircuit(
          "create-service",
          () => servicesRepository.createService(data),
          DB_CIRCUIT_OPTIONS,
        );
        await this.invalidateCache();
        if (created.isErr()) return err(created.error as any);
        return ok(created.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ServicesService] Failed to create service", error as Error);
        return err(new InternalError("Failed to create service", { error }));
      }),
    );
  }

  async updateService(
    id: number,
    data: Partial<InsertService>,
  ): Promise<Result<Service, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<Service, AppError>> => {
        const updated = await withCircuit(
          `update-service-${id}`,
          () => servicesRepository.updateService(id, data),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) {
          return err(new NotFoundError(`Service with ID ${id}`));
        }
        await this.invalidateCache();
        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ServicesService] Failed to update service", { id }, error as Error);
        return err(new InternalError(`Failed to update service ${id}`, { error }));
      }),
    );
  }

  async deleteService(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-service-${id}`,
          () => servicesRepository.deleteService(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!deleted) {
          return err(new NotFoundError(`Service with ID ${id}`));
        }
        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ServicesService] Failed to delete service", { id }, error as Error);
        return err(new InternalError(`Failed to delete service ${id}`, { error }));
      }),
    );
  }

  async reorderServices(orderedIds: number[]): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "reorder-services",
          () => servicesRepository.reorderServices(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );
        await this.invalidateCache();
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[ServicesService] Failed to reorder services", error as Error);
        return err(new InternalError("Failed to reorder services", { error }));
      }),
    );
  }
}

export const servicesService = new ServicesService();
