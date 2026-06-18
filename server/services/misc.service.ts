import { err, ok, type Result } from "neverthrow";
import type {
  Certificate,
  Fabric,
  Fiber,
  InsertCertificate,
  InsertFabric,
  InsertFiber,
  SizeChart,
} from "../../shared/index.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * Service for managing miscellaneous taxonomy data (Fibers, Fabrics, Certificates, Size Charts)
 * Enforces Result-based patterns and circuit breaker protection.
 */
class MiscService {
  // FIBERS
  async getFibers(): Promise<Result<Fiber[], AppError>> {
    try {
      const fibers = await withCircuit(
        "get-fibers",
        () => miscRepository.getFibers(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(fibers);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch fibers", error as Error);
      return err(new InternalError("Failed to fetch fibers", { error }));
    }
  }

  async getFiber(id: number): Promise<Result<Fiber, AppError>> {
    try {
      const fiber = await withCircuit(
        `get-fiber-${id}`,
        () => miscRepository.getFiber(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!fiber) return err(new NotFoundError(`Fiber with ID ${id}`));
      return ok(fiber);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch fiber", { id }, error as Error);
      return err(new InternalError(`Failed to fetch fiber ${id}`, { error }));
    }
  }

  async createFiber(data: InsertFiber): Promise<Result<Fiber, AppError>> {
    try {
      const created = await withCircuit(
        "create-fiber",
        () => miscRepository.createFiber(data),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[MiscService] Failed to create fiber", error as Error);
      return err(new InternalError("Failed to create fiber", { error }));
    }
  }

  async updateFiber(id: number, data: Partial<InsertFiber>): Promise<Result<Fiber, AppError>> {
    try {
      const updated = await withCircuit(
        `update-fiber-${id}`,
        () => miscRepository.updateFiber(id, data),
        DB_CIRCUIT_OPTIONS,
      );
      if (!updated) return err(new NotFoundError(`Fiber with ID ${id}`));
      return ok(updated);
    } catch (error) {
      logger.error("[MiscService] Failed to update fiber", { id }, error as Error);
      return err(new InternalError(`Failed to update fiber ${id}`, { error }));
    }
  }

  async deleteFiber(id: number): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        `delete-fiber-${id}`,
        () => miscRepository.deleteFiber(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!success) return err(new NotFoundError(`Fiber with ID ${id}`));
      return ok(success);
    } catch (error) {
      logger.error("[MiscService] Failed to delete fiber", { id }, error as Error);
      return err(new InternalError(`Failed to delete fiber ${id}`, { error }));
    }
  }

  // FABRICS
  async getFabrics(): Promise<Result<Fabric[], AppError>> {
    try {
      const fabrics = await withCircuit(
        "get-fabrics",
        () => miscRepository.getFabrics(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(fabrics);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch fabrics", error as Error);
      return err(new InternalError("Failed to fetch fabrics", { error }));
    }
  }

  async getFabric(id: number): Promise<Result<Fabric, AppError>> {
    try {
      const fabric = await withCircuit(
        `get-fabric-${id}`,
        () => miscRepository.getFabric(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!fabric) return err(new NotFoundError(`Fabric with ID ${id}`));
      return ok(fabric);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch fabric", { id }, error as Error);
      return err(new InternalError(`Failed to fetch fabric ${id}`, { error }));
    }
  }

  async createFabric(data: InsertFabric): Promise<Result<Fabric, AppError>> {
    try {
      const created = await withCircuit(
        "create-fabric",
        () => miscRepository.createFabric(data),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[MiscService] Failed to create fabric", error as Error);
      return err(new InternalError("Failed to create fabric", { error }));
    }
  }

  async updateFabric(id: number, data: Partial<InsertFabric>): Promise<Result<Fabric, AppError>> {
    try {
      const updated = await withCircuit(
        `update-fabric-${id}`,
        () => miscRepository.updateFabric(id, data),
        DB_CIRCUIT_OPTIONS,
      );
      if (!updated) return err(new NotFoundError(`Fabric with ID ${id}`));
      return ok(updated);
    } catch (error) {
      logger.error("[MiscService] Failed to update fabric", { id }, error as Error);
      return err(new InternalError(`Failed to update fabric ${id}`, { error }));
    }
  }

  async deleteFabric(id: number): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        `delete-fabric-${id}`,
        () => miscRepository.deleteFabric(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!success) return err(new NotFoundError(`Fabric with ID ${id}`));
      return ok(success);
    } catch (error) {
      logger.error("[MiscService] Failed to delete fabric", { id }, error as Error);
      return err(new InternalError(`Failed to delete fabric ${id}`, { error }));
    }
  }

  // CERTIFICATES
  async getCertificates(): Promise<Result<Certificate[], AppError>> {
    try {
      const certificates = await withCircuit(
        "get-certificates",
        () => miscRepository.getCertificates(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(certificates);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch certificates", error as Error);
      return err(new InternalError("Failed to fetch certificates", { error }));
    }
  }

  async createCertificate(data: InsertCertificate): Promise<Result<Certificate, AppError>> {
    try {
      const created = await withCircuit(
        "create-certificate",
        () => miscRepository.createCertificate(data),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[MiscService] Failed to create certificate", error as Error);
      return err(new InternalError("Failed to create certificate", { error }));
    }
  }

  async updateCertificate(
    id: number,
    data: Partial<InsertCertificate>,
  ): Promise<Result<Certificate, AppError>> {
    try {
      const updated = await withCircuit(
        `update-certificate-${id}`,
        () => miscRepository.updateCertificate(id, data),
        DB_CIRCUIT_OPTIONS,
      );
      if (!updated) return err(new NotFoundError(`Certificate with ID ${id}`));
      return ok(updated);
    } catch (error) {
      logger.error("[MiscService] Failed to update certificate", { id }, error as Error);
      return err(new InternalError(`Failed to update certificate ${id}`, { error }));
    }
  }

  async deleteCertificate(id: number): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        `delete-certificate-${id}`,
        () => miscRepository.deleteCertificate(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!success) return err(new NotFoundError(`Certificate with ID ${id}`));
      return ok(success);
    } catch (error) {
      logger.error("[MiscService] Failed to delete certificate", { id }, error as Error);
      return err(new InternalError(`Failed to delete certificate ${id}`, { error }));
    }
  }

  // SIZE CHARTS
  async getSizeCharts(): Promise<Result<SizeChart[], AppError>> {
    try {
      const charts = await withCircuit(
        "get-size-charts",
        () => miscRepository.getSizeCharts(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(charts);
    } catch (error) {
      logger.error("[MiscService] Failed to fetch size charts", error as Error);
      return err(new InternalError("Failed to fetch size charts", { error }));
    }
  }
}

export const miscService = new MiscService();
