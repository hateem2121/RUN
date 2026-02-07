/**
 * Feature Flags Service
 * Provides runtime feature toggles with gradual rollout support
 *
 * Reference: https://martinfowler.com/articles/feature-toggles.html
 */

import { type Request, type Response, Router } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { authService } from "../services/auth-service.js";

// Feature flag definition
interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number | undefined; // Gradual rollout (0-100)
  userWhitelist?: string[]; // Specific users for testing
  description?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (could be backed by Redis/DB in future)
const featureFlags: Map<string, FeatureFlag> = new Map([
  [
    "enableTechnologyBatchAPI",
    {
      key: "enableTechnologyBatchAPI",
      enabled: true,
      description: "Enable batch API for technology endpoints",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "enableModularArchitecture",
    {
      key: "enableModularArchitecture",
      enabled: true,
      description: "Enable modular architecture components",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "enableNewAdminUI",
    {
      key: "enableNewAdminUI",
      enabled: true,
      description: "Enable new admin UI components",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "useModularTechnologyComponents",
    {
      key: "useModularTechnologyComponents",
      enabled: true,
      description: "Use modular technology page components",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "enableCircuitBreaker",
    {
      key: "enableCircuitBreaker",
      enabled: true,
      percentage: 100,
      description: "Enable circuit breaker for external service calls",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "enableIdempotency",
    {
      key: "enableIdempotency",
      enabled: true,
      percentage: 100,
      description: "Enable idempotency key support for mutations",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);

const router = Router();

/**
 * Check if a feature is enabled for a specific user
 * @param flagKey - Feature flag key
 * @param userId - Optional user ID for gradual rollout
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(flagKey: string, userId?: string): boolean {
  const flag = featureFlags.get(flagKey);
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check user whitelist
  if (userId && flag.userWhitelist?.includes(userId)) {
    return true;
  }

  // Check percentage rollout
  if (flag.percentage !== undefined && flag.percentage < 100) {
    // Use consistent hashing for user-based rollout
    if (userId) {
      const hash = hashString(userId + flagKey);
      return hash % 100 < flag.percentage;
    }
    // For anonymous users, use random rollout
    return Math.random() * 100 < flag.percentage;
  }

  return true;
}

/**
 * Simple string hash for consistent rollout
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get all feature flags (for client bootstrapping)
 */
export function getAllFlags(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [key, flag] of featureFlags.entries()) {
    result[key] = flag.enabled;
  }
  return result;
}

// GET /api/feature-flags
router.get("/", (_req: Request, res: Response) => {
  res.json(getAllFlags());
});

// GET /api/feature-flags/detailed (admin only in future)
router.get("/detailed", (_req: Request, res: Response) => {
  const flags = Array.from(featureFlags.values());
  res.json({
    flags,
    count: flags.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/feature-flags/:key/toggle (admin only)
router.post("/:key/toggle", authService.requireAdmin, (req: Request, res: Response) => {
  const key = req.params.key as string;
  if (!key) {
    res.status(400).json({ error: "Key parameter is required" });
    return;
  }
  const flag = featureFlags.get(key);

  if (!flag) {
    res.status(404).json({ error: "Feature flag not found", key });
    return;
  }

  flag.enabled = !flag.enabled;
  flag.updatedAt = new Date();
  featureFlags.set(key, flag);

  logger.info(`[FeatureFlags] Toggled ${key} to ${flag.enabled}`);
  res.json({ key, enabled: flag.enabled });
});

// PUT /api/feature-flags/:key (admin only)
router.put("/:key", authService.requireAdmin, (req: Request, res: Response) => {
  const key = req.params.key as string;
  if (!key) {
    res.status(400).json({ error: "Key parameter is required" });
    return;
  }
  const { enabled, percentage, userWhitelist, description } = req.body;

  let flag = featureFlags.get(key);

  if (!flag) {
    // Create new flag
    flag = {
      key,
      enabled: enabled ?? false,
      percentage,
      userWhitelist,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    // Update existing
    if (enabled !== undefined) flag.enabled = enabled;
    if (percentage !== undefined) flag.percentage = percentage;
    if (userWhitelist !== undefined) flag.userWhitelist = userWhitelist;
    if (description !== undefined) flag.description = description;
    flag.updatedAt = new Date();
  }

  featureFlags.set(key, flag);
  logger.info(`[FeatureFlags] Updated ${key}`, {
    enabled: flag.enabled,
    percentage: flag.percentage,
  });
  res.json(flag);
});

export default router;
