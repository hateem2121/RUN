/**
 * API UTILITIES - CONSOLIDATED
 * Unified file for utility API endpoints including resources and feature flags
 * Consolidated from resources-api.ts and feature-flags.ts for better maintainability
 */

import type { Request, Response } from "express";
import { z } from "zod";
// PHASE 2B: Removed pagination imports - eliminated after pagination cleanup
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import {
  FeatureFlagParamSchema,
  FeatureFlagsQuerySchema,
  FeatureFlagUpdateBodySchema,
  ResourcesBatchQuerySchema,
} from "./schemas.js";

// Feature flags implementation - stubbed for now
const featureFlags = {
  // Internal flags storage (stub - would be real flag registry in production)
  _flags: {} as Record<string, boolean>,

  getAllFlags: function (options?: { limit?: number | undefined; offset?: number }) {
    // Parse options with defaults
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    // Clamp to non-negative integers, then enforce max limit of 100
    const safeLimit = Math.min(Math.max(0, limit), 100);
    const safeOffset = Math.max(0, offset);

    // Paginate actual flags (not a new empty object)
    const entries = Object.entries(this._flags);
    const total = entries.length;
    const paginatedEntries = entries.slice(safeOffset, safeOffset + safeLimit);
    const hasMore = safeOffset + safeLimit < total;

    return {
      flags: Object.fromEntries(paginatedEntries),
      metadata: { total, limit: safeLimit, offset: safeOffset, hasMore },
    };
  },
  emergencyRollback: function () {
    this._flags = {};
  },
  setRuntimeOverride: function (flag: string, enabled: boolean) {
    this._flags[flag] = enabled;
  },
};

// PHASE 2B: Simplified search schema without pagination
const searchSchema = z.object({
  q: z.string().optional(),
  type: z
    .enum(["all", "certificate", "accessory", "sizechart", "fabric", "fiber"])
    .optional()
    .default("all"),
  active: z.coerce.boolean().optional(),
});

/**
 * RESOURCES API SECTION
 * Handles batch fetching and search for certificates, accessories, size charts, fabrics, and fibers
 */
import type { Application } from "express";
import type { IStorage } from "../../storage.js";

export function setupResourceRoutes(app: Application, storage: IStorage) {
  // Batch endpoint to fetch multiple resource types in one request
  app.get("/api/resources/batch", async (req: Request, res: Response) => {
    const query = ResourcesBatchQuerySchema.parse(req.query);
    const types = query.types ? query.types.split(",") : ["all"];
    const activeOnly = query.active === "true";

    const result: Record<string, unknown[]> = {};
    const promises: Promise<any>[] = [];
    const typeMap: string[] = [];

    if (types.includes("all") || types.includes("certificate")) {
      promises.push(storage.getCertificates());
      typeMap.push("certificates");
    }
    if (types.includes("all") || types.includes("accessory")) {
      promises.push(storage.getAccessories());
      typeMap.push("accessories");
    }
    if (types.includes("all") || types.includes("sizechart")) {
      promises.push(storage.getSizeCharts());
      typeMap.push("sizeCharts");
    }
    if (types.includes("all") || types.includes("fabric")) {
      promises.push(storage.getFabrics());
      typeMap.push("fabrics");
    }
    if (types.includes("all") || types.includes("fiber")) {
      promises.push(storage.getFibers());
      typeMap.push("fibers");
    }

    const data = await Promise.all(promises);

    typeMap.forEach((type, index) => {
      let items = data[index] || [];
      if (activeOnly) {
        items = items.filter((item: { active?: boolean }) => item.active !== false);
      }
      result[type] = items;
    });

    return res.json(result);
  });

  // UNIFIED PAGINATION: Standardized search endpoint with consistent pagination
  app.get("/api/resources/search", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const params = searchSchema.parse(req.query);
    const { q: search, type, active } = params;

    if (!search || search.length < 2) {
      return res.json({ success: true, data: [], total: 0 });
    }

    const searchTerm = search.toLowerCase();
    const searchWords = searchTerm.split(/\s+/).filter((w) => w.length > 1);

    // Fetch only required data based on type
    const fetchPromises: Promise<any>[] = [];
    const fetchTypes: string[] = [];

    if (type === "all" || type === "certificate") {
      fetchPromises.push(storage.getCertificates());
      fetchTypes.push("certificates");
    }
    if (type === "all" || type === "accessory") {
      fetchPromises.push(storage.getAccessories());
      fetchTypes.push("accessories");
    }
    if (type === "all" || type === "sizechart") {
      fetchPromises.push(storage.getSizeCharts());
      fetchTypes.push("sizeCharts");
    }
    if (type === "all" || type === "fabric") {
      fetchPromises.push(storage.getFabrics());
      fetchTypes.push("fabrics");
    }
    if (type === "all" || type === "fiber") {
      fetchPromises.push(storage.getFibers());
      fetchTypes.push("fibers");
    }

    const fetchedData = await Promise.all(fetchPromises);
    const results: Array<Record<string, unknown>> = [];

    // Process each resource type
    fetchTypes.forEach((dataType, index) => {
      const items = fetchedData[index] || [];

      items.forEach((item: Record<string, unknown>) => {
        // Skip inactive items if active filter is set
        if (active === true && item.active === false) return;
        if (active === false && item.active !== false) return;

        // Create searchable text
        const searchableText = createSearchableText(item, dataType);

        // Check if all search words are found
        const matches = searchWords.every((word) => searchableText.includes(word));

        if (matches) {
          results.push({
            ...item,
            _type: dataType.slice(0, -1), // Remove 's' from plural
            _score: calculateRelevanceScore(item, searchWords, dataType),
          });
        }
      });
    });

    // Sort by relevance score
    results.sort((a, b) => (b._score as number) - (a._score as number));

    // PHASE 2B: Simplified response without pagination
    const responseTime = Date.now() - startTime;
    logger.debug(`[Resource Search] Found ${results.length} results in ${responseTime}ms`);
    return res.json({ success: true, data: results, total: results.length });
  });

  /**
   * FEATURE FLAGS API SECTION
   * Consolidated from feature-flags.ts - Runtime configuration and emergency controls
   */

  // Get all current feature flags
  app.get("/api/feature-flags", (req: Request, res: Response) => {
    // Parse and validate pagination params (prevent negative values)
    const { limit, offset } = FeatureFlagsQuerySchema.parse(req.query);

    const result = featureFlags.getAllFlags({ limit, offset });
    res.json({
      success: true,
      data: result.flags,
      ...result.metadata,
      timestamp: new Date().toISOString(),
    });
  });

  // Emergency rollback endpoint
  // prettier-ignore
  app.post(
    "/api/feature-flags/emergency-rollback",
    authService.requireAdmin,
    (_req: Request, res: Response) => {
      // security
      featureFlags.emergencyRollback();

      const result = featureFlags.getAllFlags();
      res.json({
        success: true,
        message: "Emergency rollback activated - all experimental features disabled",
        flags: result.flags,
        timestamp: new Date().toISOString(),
      });

      logger.error("[API] Emergency rollback activated via API endpoint");
    },
  );

  // Runtime flag override (for testing)
  // prettier-ignore
  app.post("/api/feature-flags/:flag", authService.requireAdmin, (req: Request, res: Response) => {
    const { flag } = FeatureFlagParamSchema.parse(req.params);
    const { enabled } = FeatureFlagUpdateBodySchema.parse(req.body);

    featureFlags.setRuntimeOverride(flag!, enabled);

    const result = featureFlags.getAllFlags();
    return res.json({
      success: true,
      message: `Feature flag ${flag} set to ${enabled}`,
      flags: result.flags,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * HELPER FUNCTIONS
 * Supporting utilities for search and scoring functionality
 */

function createSearchableText(item: Record<string, unknown>, type: string): string {
  const parts: string[] = [];

  // Common fields
  if (item.name) parts.push(String(item.name));
  if (item.type) parts.push(String(item.type));
  if (item.description) parts.push(String(item.description));

  // Type-specific fields
  switch (type) {
    case "certificates":
      if (item.issuingBody) parts.push(String(item.issuingBody));
      break;
    case "accessories":
      if (item.category) parts.push(String(item.category));
      if (item.specifications && Array.isArray(item.specifications)) {
        parts.push(...item.specifications.map(String));
      }
      break;
    case "sizeCharts":
      if (item.region) parts.push(String(item.region));
      if (item.categories && Array.isArray(item.categories)) {
        parts.push(...item.categories.map(String));
      }
      break;
    case "fabrics":
      if (item.weight) parts.push(String(item.weight));
      if (item.weaveType) parts.push(String(item.weaveType));
      if (item.finishTreatment) parts.push(String(item.finishTreatment));
      if (item.compositions) {
        (item.compositions as Array<Record<string, unknown>>)?.forEach((comp) => {
          if (comp.name) parts.push(String(comp.name));
          (comp.fibers as Array<Record<string, unknown>>)?.forEach((fiber) => {
            if (fiber.fiberName) parts.push(String(fiber.fiberName));
          });
        });
      }
      break;
    case "fibers":
      if (item.properties) parts.push(String(item.properties));
      if (item.sustainabilityScore)
        parts.push(`sustainability-${String(item.sustainabilityScore)}`);
      break;
  }

  return parts.filter(Boolean).join(" ").toLowerCase();
}

function calculateRelevanceScore(
  item: Record<string, unknown>,
  searchWords: string[],
  _type: string,
): number {
  let score = 0;

  // Name matches are worth more
  if (item.name) {
    const nameLower = String(item.name).toLowerCase();
    searchWords.forEach((word) => {
      if (nameLower.includes(word)) {
        score += nameLower.startsWith(word) ? 10 : 5;
      }
    });
  }

  // Type/category matches
  if (item.type) {
    const typeLower = String(item.type).toLowerCase();
    searchWords.forEach((word) => {
      if (typeLower.includes(word)) score += 3;
    });
  }

  // Active items get a bonus
  if (item.active !== false) score += 1;

  return score;
}
