import {
  type InsertLegalPolicy,
  insertLegalPolicySchema,
  type LegalPolicy,
} from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { legalRepository } from "./repositories/index.js";

const DEFAULT_POLICIES: Record<string, LegalPolicy> = {
  "privacy-policy": {
    id: 1,
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "Our Privacy Policy outlines how we collect, use, and protect your personal information when using our services. We take your privacy seriously and implement robust security measures to safeguard your data.",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "terms-of-service": {
    id: 2,
    slug: "terms-of-service",
    title: "Terms of Service",
    content:
      "These Terms of Service govern your use of our platform and manufacturing services. By accessing our services, you agree to comply with these terms, our policies, and all applicable laws and regulations.",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

class LegalService {
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateLegal?.();
    } catch (error) {
      logger.error("[LegalService] Cache invalidation failed", error as Error);
    }
  }

  async getLegalPolicies(includeInactive = false): Promise<Result<LegalPolicy[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<LegalPolicy[], AppError>> => {
        const list = await withCircuit(
          "get-legal-policies",
          () => legalRepository.getLegalPolicies(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );

        if (!list || list.length === 0) {
          const fallbacks = Object.values(DEFAULT_POLICIES);
          return ok(includeInactive ? fallbacks : fallbacks.filter((lp) => lp.isActive));
        }

        return ok(list);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Failed to fetch legal policies", { error }));
      }),
    ).orElse((error) => {
      logger.error("[LegalService] Failed to fetch legal policies", error as Error);
      const fallbacks = Object.values(DEFAULT_POLICIES);
      const filtered = includeInactive ? fallbacks : fallbacks.filter((lp) => lp.isActive);
      if (filtered.length === 0) {
        return err(error);
      }
      return ok(filtered);
    });
  }

  async getLegalPolicyBySlug(
    slug: string,
    includeInactive = false,
  ): Promise<Result<LegalPolicy, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<LegalPolicy, AppError>> => {
        const policy = await withCircuit(
          `get-legal-policy-${slug}`,
          () => legalRepository.getLegalPolicyBySlug(slug, includeInactive),
          DB_CIRCUIT_OPTIONS,
        );

        if (!policy) {
          const fallback = DEFAULT_POLICIES[slug];
          if (!fallback) {
            return err(new NotFoundError(`Legal policy with slug ${slug}`));
          }
          return ok(fallback);
        }

        return ok(policy);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError(`Failed to fetch legal policy ${slug}`, { error }));
      }),
    ).orElse((error) => {
      logger.error("[LegalService] Failed to fetch legal policy by slug", { slug }, error as Error);
      const fallback = DEFAULT_POLICIES[slug];
      if (!fallback) {
        return err(error);
      }
      return ok(fallback);
    });
  }

  async getLegalPolicy(id: number): Promise<Result<LegalPolicy, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<LegalPolicy, AppError>> => {
        const policy = await withCircuit(
          `get-legal-policy-id-${id}`,
          () => legalRepository.getLegalPolicy(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!policy) {
          const fallback = Object.values(DEFAULT_POLICIES).find((lp) => lp.id === id);
          if (!fallback) {
            return err(new NotFoundError(`Legal policy with ID ${id}`));
          }
          return err(new NotFoundError(`Legal policy with ID ${id}`));
        }

        return ok(policy);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError(`Failed to fetch legal policy ${id}`, { error }));
      }),
    ).orElse((error) => {
      logger.error("[LegalService] Failed to fetch legal policy", { id }, error as Error);
      const fallback = Object.values(DEFAULT_POLICIES).find((lp) => lp.id === id);
      if (!fallback) {
        return err(error);
      }
      return ok(fallback);
    });
  }

  async createLegalPolicy(data: InsertLegalPolicy): Promise<Result<LegalPolicy, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<LegalPolicy, AppError>> => {
        const parsed = insertLegalPolicySchema.parse(data);
        if (parsed.content) parsed.content = sanitizeHtml(parsed.content);

        const created = await withCircuit(
          "create-legal-policy",
          () => legalRepository.createLegalPolicy(parsed),
          DB_CIRCUIT_OPTIONS,
        );
        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (created.isErr()) return err(created.error as any);
        return ok(created.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[LegalService] Failed to create legal policy", error as Error);
        return err(new InternalError("Failed to create legal policy", { error }));
      }),
    );
  }

  async updateLegalPolicy(
    id: number,
    data: Partial<InsertLegalPolicy>,
  ): Promise<Result<LegalPolicy, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<LegalPolicy, AppError>> => {
        const parsed = insertLegalPolicySchema.partial().parse(data);
        if (parsed.content) parsed.content = sanitizeHtml(parsed.content);

        const updated = await withCircuit(
          `update-legal-policy-${id}`,
          () => legalRepository.updateLegalPolicy(id, parsed as Partial<InsertLegalPolicy>),
          DB_CIRCUIT_OPTIONS,
        );
        if (!updated) {
          return err(new NotFoundError(`Legal policy with ID ${id}`));
        }
        await this.invalidateCache();
        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[LegalService] Failed to update legal policy", { id }, error as Error);
        return err(new InternalError(`Failed to update legal policy ${id}`, { error }));
      }),
    );
  }

  async deleteLegalPolicy(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-legal-policy-${id}`,
          () => legalRepository.deleteLegalPolicy(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!deleted) {
          return err(new NotFoundError(`Legal policy with ID ${id}`));
        }
        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[LegalService] Failed to delete legal policy", { id }, error as Error);
        return err(new InternalError(`Failed to delete legal policy ${id}`, { error }));
      }),
    );
  }
}

export const legalService = new LegalService();
