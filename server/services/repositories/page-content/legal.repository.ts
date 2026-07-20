import { type InsertLegalPolicy, type LegalPolicy, legalPolicies } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import { db } from "../../../db.js";
import { emitCacheInvalidation } from "../../../lib/cache/cache-events.js";
import { UnifiedCache } from "../../../lib/cache/unified-cache.js";
import { logger } from "../../../lib/monitoring/logger.js";
import { StorageSingleton } from "../../../lib/storage-singleton.js";
import { invalidateHtmlCache } from "../../../middleware/ssr-cache.js";

const unifiedCache = UnifiedCache.getInstance();
const LEGAL_CACHE_TTL = 3600; // 1 hour (in seconds)

class LegalRepository {
  async getLegalPolicies(includeInactive = false): Promise<LegalPolicy[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getLegalPolicies(includeInactive);
    }
    const cacheKey = includeInactive ? "legal:all" : "legal";
    try {
      const cached = await unifiedCache.get<LegalPolicy[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get legal policies from cache:", error);
    }

    let query = db.select().from(legalPolicies).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(legalPolicies.isActive, true));
    }
    const result = await query;

    try {
      await unifiedCache.set(cacheKey, result, LEGAL_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set legal policies cache:", error);
    }

    return result;
  }

  async getLegalPolicyBySlug(
    slug: string,
    includeInactive = false,
  ): Promise<LegalPolicy | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getLegalPolicyBySlug(slug, includeInactive);
    }
    const cacheKey = `legal:slug:${slug}${includeInactive ? ":all" : ""}`;
    try {
      const cached = await unifiedCache.get<LegalPolicy>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug(`[Cache] Failed to get legal policy for slug ${slug}:`, error);
    }

    let query = db.select().from(legalPolicies).where(eq(legalPolicies.slug, slug)).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(legalPolicies.isActive, true));
    }
    const [policy] = await query.limit(1);

    if (policy) {
      try {
        await unifiedCache.set(cacheKey, policy, LEGAL_CACHE_TTL, "data");
      } catch (error) {
        logger.debug(`[Cache] Failed to set cache for legal policy ${slug}:`, error);
      }
    }

    return policy ?? undefined;
  }

  async getLegalPolicy(id: number): Promise<LegalPolicy | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getLegalPolicy(id);
    }
    const [policy] = await db.select().from(legalPolicies).where(eq(legalPolicies.id, id)).limit(1);
    return policy ?? undefined;
  }

  async createLegalPolicy(policy: InsertLegalPolicy): Promise<Result<LegalPolicy, Error>> {
    if (StorageSingleton.hasInstance()) {
      return ok(await StorageSingleton.getInstance().createLegalPolicy(policy));
    }
    const [created] = await db.insert(legalPolicies).values(policy).returning();
    if (!created) return err(new Error("Failed to create legal policy"));

    await this.clearCache(created.slug);
    return ok(await created);
  }

  async updateLegalPolicy(
    id: number,
    policy: Partial<InsertLegalPolicy>,
  ): Promise<LegalPolicy | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateLegalPolicy(id, policy);
    }
    const [updated] = await db
      .update(legalPolicies)
      .set({ ...policy, updatedAt: new Date() })
      .where(eq(legalPolicies.id, id))
      .returning();

    if (!updated) return undefined;

    await this.clearCache(updated.slug);
    return updated;
  }

  async deleteLegalPolicy(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteLegalPolicy(id);
    }
    const policy = await this.getLegalPolicy(id);
    if (!policy) return false;

    const result = await db.delete(legalPolicies).where(eq(legalPolicies.id, id));
    await this.clearCache(policy.slug);
    return (result.rowCount ?? 0) > 0;
  }

  private async clearCache(slug: string): Promise<void> {
    await unifiedCache.del("legal");
    await unifiedCache.del("legal:all");
    await unifiedCache.del(`legal:slug:${slug}`);
    await unifiedCache.del(`legal:slug:${slug}:all`);
    await emitCacheInvalidation("legal", "update");

    // Invalidate edge cache depending on the slug
    if (slug === "privacy-policy") {
      await invalidateHtmlCache("/privacy");
    } else if (slug === "terms-of-service") {
      await invalidateHtmlCache("/terms");
    }
  }
}

export const legalRepository = new LegalRepository();
