// PostgreSQL Storage Diagnostics
// Direct access to PostgreSQL data using actual available methods

import type { Express } from "express";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import {
  accessoryRepository,
  homepageRepository,
  mediaRepository,
  miscRepository,
  productRepository,
} from "../../services/repositories/index.js";

/**
 * REDACT SENSITIVE DATA
 * Recursively masks sensitive fields in diagnostic output
 */
function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const sensitiveFields = [
    "email",
    "password",
    "hashedPassword",
    "secret",
    "token",
    "key",
    "apiKey",
  ];
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof value === "string") {
        if (key.toLowerCase().includes("email") && value.includes("@")) {
          const parts = value.split("@");
          const name = parts[0] || "";
          const domain = parts[1] || "";
          redacted[key] =
            `${name.charAt(0)}***@***${domain?.substring(domain.lastIndexOf(".")) || ""}`;
        } else {
          redacted[key] = "[REDACTED]";
        }
      } else {
        redacted[key] = "[REDACTED]";
      }
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function registerKVDiagnosticsRoutes(app: Express): void {
  // Direct PostgreSQL Storage inspection
  app.get("/api/kv-direct/inspect-all", async (_req, res) => {
    logger.debug("[PostgreSQL Direct] 🔍 Inspecting all PostgreSQL data...");

    // Get all data types using actual available methods - OPTIMIZED: Parallel queries with Promise.all
    const [
      categories,
      products,
      fabrics,
      fibers,
      certificates,
      accessories,
      sizeCharts,
      mediaAssets,
      homepageHero,
      homepageSections,
      homepageProcessCards,

      navigationItems,
      contactPageConfiguration,
    ] = await Promise.all([
      productRepository.getCategories(),
      productRepository.getProducts(),
      miscRepository.getFabrics(),
      miscRepository.getFibers(),
      miscRepository.getCertificates(),
      accessoryRepository.getAccessories(),
      miscRepository.getSizeCharts(),
      mediaRepository.getMediaAssets(),
      homepageRepository.getHomepageHero(),
      homepageRepository.getHomepageSections(),
      homepageRepository.getHomepageProcessCards(),

      miscRepository.getNavigationItems(),
      miscRepository.getContactPageConfiguration(),
    ]);

    const results = {
      categories,
      products,
      fabrics,
      fibers,
      certificates,
      accessories,
      sizeCharts,
      mediaAssets,
      homepageHero,
      homepageSections,
      homepageProcessCards,

      navigationItems,
      contactPageConfiguration,
    };

    // Count non-empty data
    const summary = Object.entries(results).reduce(
      (acc, [key, data]) => {
        const count = Array.isArray(data) ? data.length : data ? 1 : 0;
        acc[key] = count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalItems = Object.values(summary).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      message: `Found ${totalItems} total items in PostgreSQL storage`,
      summary,
      results: redactSensitiveData(results),
      timestamp: new Date().toISOString(),
    });
  });

  // Test specific entity types
  app.get("/api/kv-direct/test/:type", async (req, res) => {
    const type = req.params.type;

    const methodMap: Record<string, () => Promise<unknown>> = {
      categories: () => productRepository.getCategories(),
      products: () => productRepository.getProducts(),
      fabrics: () => miscRepository.getFabrics(),
      fibers: () => miscRepository.getFibers(),
      certificates: () => miscRepository.getCertificates(),
      accessories: () => accessoryRepository.getAccessories(),
      sizeCharts: () => miscRepository.getSizeCharts(),
      mediaAssets: () => mediaRepository.getMediaAssets(),
      homepageHero: () => homepageRepository.getHomepageHero(),
      homepageSections: () => homepageRepository.getHomepageSections(),
      homepageProcessCards: () => homepageRepository.getHomepageProcessCards(),

      navigationItems: () => miscRepository.getNavigationItems(),
      contactPageConfiguration: () => miscRepository.getContactPageConfiguration(),
    };

    const method = methodMap[type];
    if (!method) {
      throw new ValidationError(
        `Unknown type: ${type}. Available types: ${Object.keys(methodMap).join(", ")}`,
      );
    }

    const data = await method();

    return res.json({
      success: true,
      type,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
      data: redactSensitiveData(data),
    });
  });

  logger.debug("[PostgreSQL Diagnostics] ✅ PostgreSQL diagnostic routes registered");
}
