import type {
  Certificate,
  Fabric,
  Fiber,
  InsertCertificate,
  InsertFabric,
  InsertFiber,
  InsertSizeChart,
  SizeChart,
} from "@run-remix/shared";
import { ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../../lib/resilience/circuit-breaker.js";
import { miscRepository } from "../repositories/index.js";

/**
 * Service for managing miscellaneous taxonomy data (Fibers, Fabrics, Certificates, Size Charts)
 * Enforces ResultAsync direct returns and circuit breaker protection.
 */
class MiscService {
  // FIBERS
  getFibers(): ResultAsync<Fiber[], AppError> {
    return ResultAsync.fromPromise(
      withCircuit("get-fibers", () => miscRepository.getFibers(), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch fibers", error as Error);
        return new InternalError("Failed to fetch fibers", { error });
      },
    );
  }

  getFiber(id: number): ResultAsync<Fiber, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const fiber = await withCircuit(
          `get-fiber-${id}`,
          () => miscRepository.getFiber(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!fiber) throw new NotFoundError(`Fiber with ID ${id}`);
        return fiber;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch fiber", { id }, error as Error);
        return new InternalError(`Failed to fetch fiber ${id}`, { error });
      },
    );
  }

  createFiber(data: InsertFiber): ResultAsync<Fiber, AppError> {
    return ResultAsync.fromPromise(
      withCircuit("create-fiber", () => miscRepository.createFiber(data), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to create fiber", error as Error);
        return new InternalError("Failed to create fiber", { error });
      },
    );
  }

  updateFiber(id: number, data: Partial<InsertFiber>): ResultAsync<Fiber, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const updated = await withCircuit(
          `update-fiber-${id}`,
          () => miscRepository.updateFiber(id, data),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) throw new NotFoundError(`Fiber with ID ${id}`);
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to update fiber", { id }, error as Error);
        return new InternalError(`Failed to update fiber ${id}`, { error });
      },
    );
  }

  deleteFiber(id: number): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const success = await withCircuit(
          `delete-fiber-${id}`,
          () => miscRepository.deleteFiber(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!success) throw new NotFoundError(`Fiber with ID ${id}`);
        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to delete fiber", { id }, error as Error);
        return new InternalError(`Failed to delete fiber ${id}`, { error });
      },
    );
  }

  // FABRICS
  getFabrics(): ResultAsync<Fabric[], AppError> {
    return ResultAsync.fromPromise(
      withCircuit("get-fabrics", () => miscRepository.getFabrics(), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch fabrics", error as Error);
        return new InternalError("Failed to fetch fabrics", { error });
      },
    );
  }

  getFabric(id: number): ResultAsync<Fabric, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const fabric = await withCircuit(
          `get-fabric-${id}`,
          () => miscRepository.getFabric(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!fabric) throw new NotFoundError(`Fabric with ID ${id}`);
        return fabric;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch fabric", { id }, error as Error);
        return new InternalError(`Failed to fetch fabric ${id}`, { error });
      },
    );
  }

  createFabric(data: InsertFabric): ResultAsync<Fabric, AppError> {
    return ResultAsync.fromPromise(
      withCircuit("create-fabric", () => miscRepository.createFabric(data), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to create fabric", error as Error);
        return new InternalError("Failed to create fabric", { error });
      },
    );
  }

  updateFabric(id: number, data: Partial<InsertFabric>): ResultAsync<Fabric, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const updated = await withCircuit(
          `update-fabric-${id}`,
          () => miscRepository.updateFabric(id, data),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) throw new NotFoundError(`Fabric with ID ${id}`);
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to update fabric", { id }, error as Error);
        return new InternalError(`Failed to update fabric ${id}`, { error });
      },
    );
  }

  deleteFabric(id: number): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const success = await withCircuit(
          `delete-fabric-${id}`,
          () => miscRepository.deleteFabric(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!success) throw new NotFoundError(`Fabric with ID ${id}`);
        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to delete fabric", { id }, error as Error);
        return new InternalError(`Failed to delete fabric ${id}`, { error });
      },
    );
  }

  // CERTIFICATES
  getCertificates(): ResultAsync<Certificate[], AppError> {
    return ResultAsync.fromPromise(
      withCircuit("get-certificates", () => miscRepository.getCertificates(), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch certificates", error as Error);
        return new InternalError("Failed to fetch certificates", { error });
      },
    );
  }

  getCertificate(id: number): ResultAsync<Certificate, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const cert = await withCircuit(
          `get-certificate-${id}`,
          () => miscRepository.getCertificate(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!cert) throw new NotFoundError(`Certificate with ID ${id}`);
        return cert;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch certificate", { id }, error as Error);
        return new InternalError(`Failed to fetch certificate ${id}`, { error });
      },
    );
  }

  createCertificate(data: InsertCertificate): ResultAsync<Certificate, AppError> {
    return ResultAsync.fromPromise(
      withCircuit(
        "create-certificate",
        () => miscRepository.createCertificate(data),
        DB_CIRCUIT_OPTIONS,
      ),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to create certificate", error as Error);
        return new InternalError("Failed to create certificate", { error });
      },
    );
  }

  updateCertificate(
    id: number,
    data: Partial<InsertCertificate>,
  ): ResultAsync<Certificate, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const updated = await withCircuit(
          `update-certificate-${id}`,
          () => miscRepository.updateCertificate(id, data),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) throw new NotFoundError(`Certificate with ID ${id}`);
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to update certificate", { id }, error as Error);
        return new InternalError(`Failed to update certificate ${id}`, { error });
      },
    );
  }

  deleteCertificate(id: number): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const success = await withCircuit(
          `delete-certificate-${id}`,
          () => miscRepository.deleteCertificate(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!success) throw new NotFoundError(`Certificate with ID ${id}`);
        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to delete certificate", { id }, error as Error);
        return new InternalError(`Failed to delete certificate ${id}`, { error });
      },
    );
  }

  // SIZE CHARTS
  getSizeCharts(): ResultAsync<SizeChart[], AppError> {
    return ResultAsync.fromPromise(
      withCircuit("get-size-charts", () => miscRepository.getSizeCharts(), DB_CIRCUIT_OPTIONS),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to fetch size charts", error as Error);
        return new InternalError("Failed to fetch size charts", { error });
      },
    );
  }

  createSizeChart(data: InsertSizeChart): ResultAsync<SizeChart, AppError> {
    return ResultAsync.fromPromise(
      withCircuit(
        "create-size-chart",
        () => miscRepository.createSizeChart(data),
        DB_CIRCUIT_OPTIONS,
      ),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to create size chart", error as Error);
        return new InternalError("Failed to create size chart", { error });
      },
    );
  }

  updateSizeChart(id: number, data: Partial<InsertSizeChart>): ResultAsync<SizeChart, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const updated = await withCircuit(
          `update-size-chart-${id}`,
          () => miscRepository.updateSizeChart(id, data),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) throw new NotFoundError(`Size chart with ID ${id}`);
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to update size chart", { id }, error as Error);
        return new InternalError(`Failed to update size chart ${id}`, { error });
      },
    );
  }

  deleteSizeChart(id: number): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const success = await withCircuit(
          `delete-size-chart-${id}`,
          () => miscRepository.deleteSizeChart(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!success) throw new NotFoundError(`Size chart with ID ${id}`);
        return success;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MiscService] Failed to delete size chart", { id }, error as Error);
        return new InternalError(`Failed to delete size chart ${id}`, { error });
      },
    );
  }
}

export const miscService = new MiscService();
