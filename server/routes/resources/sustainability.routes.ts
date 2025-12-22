/**
 * SUSTAINABILITY RESOURCE ROUTER
 * 
 * Modular Express Router for Unified Sustainability Configuration
 * Handles main sustainability page configuration and settings
 * 
 * Routes:
 * - GET   /api/sustainability           - Get unified sustainability config
 * - PATCH /api/sustainability           - Update unified sustainability config
 */

import { type Request, Router } from 'express';
import { z } from 'zod';
import { CacheKeys } from '../../lib/cache-strategies.js';
import { withTimeout } from '../../lib/request-timeout.js';
import { logger } from '../../lib/smart-logger.js';
import { getStorage } from '../../lib/storage-singleton.js';
import { unifiedCache } from '../../lib/unified-cache.js';

const router = Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased from 3600s (60min) to 10800s (180min)
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - static content changes rarely

/**
 * Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes('/admin') || req.query.nocache === 'true';
}

/**
 * GET /api/sustainability/debug/validation
 * DEBUG ENDPOINT - Tests various payload structures against Zod schema
 * Tests certificationIds edge cases: null, [], undefined, and real arrays
 * MUST BE BEFORE ROOT ROUTE to avoid being caught by '/'
 */
router.get('/debug/validation', async (_req, res) => {
  try {
    const updateSchema = z.object({
      title: z.string().min(1).optional(),
      headline: z.string().nullable().optional(),
      subheadline: z.string().nullable().optional(),
      content: z.string().nullable().optional(),
      sectionType: z.string().min(1).optional(),
      data: z.record(z.string(), z.any()).optional(),
      metrics: z.record(z.string(), z.any()).optional(),
      ctaText: z.string().nullable().optional(),
      ctaLink: z.string().nullable().optional(),
      metricsTitle: z.string().nullable().optional(),
      metricsDescription: z.string().nullable().optional(),
      certificationsTitle: z.string().nullable().optional(),
      certificationsDescription: z.string().nullable().optional(),
      certificationsFooterNote: z.string().nullable().optional(),
      certificationIds: z.array(z.number()).nullable().optional(),
      initiativesTitle: z.string().nullable().optional(),
      initiativesDescription: z.string().nullable().optional(),
      goalsTitle: z.string().nullable().optional(),
      goalsDescription: z.string().nullable().optional(),
      fabricPortfolioTitle: z.string().nullable().optional(),
      callToActionTitle: z.string().nullable().optional(),
      callToActionDescription: z.string().nullable().optional(),
      callToActionButtonText: z.string().nullable().optional(),
      callToActionButtonLink: z.string().nullable().optional(),
      buttonText: z.string().nullable().optional(),
      buttonLink: z.string().nullable().optional(),
      backgroundImageId: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    });

    const testPayloads = [
      { name: 'certificationIds: null', payload: { certificationIds: null, title: 'Test' } },
      { name: 'certificationIds: []', payload: { certificationIds: [], title: 'Test' } },
      { name: 'certificationIds: undefined', payload: { title: 'Test' } },
      { name: 'certificationIds: [1,2,3]', payload: { certificationIds: [1, 2, 3], title: 'Test' } },
      { name: 'certificationIds: ["1"]', payload: { certificationIds: ['1' as any], title: 'Test' } },
      { name: 'no data wrapper', payload: { title: 'Test', ctaText: 'Click' } },
      { name: 'with data wrapper', payload: { data: { title: 'Test' } } },
    ];

    const results = testPayloads.map(({ name, payload }) => {
      try {
        const validated = updateSchema.parse(payload);
        return {
          test: name,
          status: 'PASS',
          payload,
          validated,
          error: null
        };
      } catch (err) {
        if (err instanceof z.ZodError) {
          return {
            test: name,
            status: 'FAIL',
            payload,
            validated: null,
            error: {
              message: err.message,
              issues: err.issues
            }
          };
        }
        return {
          test: name,
          status: 'ERROR',
          payload,
          validated: null,
          error: String(err)
        };
      }
    });

    return res.json({
      success: true,
      schemaInfo: {
        certificationIdsType: 'z.array(z.number()).nullable().optional()',
        description: 'Accepts: null, undefined, or array of numbers'
      },
      testResults: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        failed: results.filter(r => r.status === 'FAIL').length,
        errors: results.filter(r => r.status === 'ERROR').length
      }
    });
  } catch (error) {
    logger.error('[Debug Validation] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug endpoint failed'
    });
  }
});

/**
 * GET /api/sustainability
 * Returns unified sustainability configuration
 * Cached for 180 minutes (3 hours) unless admin bypass
 */
router.get('/', async (req, res) => {
  try {
    // Check cache first (unless admin bypass)
    const cacheKey = CacheKeys.sustainability.unified();
    const cached = await unifiedCache.get(cacheKey);
    
    if (cached && !shouldBypassCache(req)) {
      logger.info('[Sustainability] Cache hit - returning cached config');
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cached);
    }

    // Cache miss or admin bypass - fetch from database
    if (shouldBypassCache(req)) {
      logger.info('[Sustainability] Admin/debug request - bypassing cache');
    } else {
      logger.info('[Sustainability] Cache miss - fetching from database');
    }
    
    const config = await withTimeout(
      getStorage().getUnifiedSustainability(),
      10000,
      'Get unified sustainability config'
    );
    
    if (!config) {
      logger.warn('[Sustainability] No config found in database');
      return res.status(404).json({
        success: false,
        error: {
          message: 'Sustainability configuration not found'
        }
      });
    }
    
    // Store in cache
    await unifiedCache.set(cacheKey, config, CACHE_TTL_STATIC * 1000);
    logger.info('[Sustainability] ✅ Config cached for 180 minutes / 3 hours');
    
    return res.json(config);
  } catch (error) {
    logger.error('[Sustainability] Error getting config:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get sustainability config'
      }
    });
  }
});

/**
 * PATCH /api/sustainability
 * Updates unified sustainability configuration
 * Validates input and invalidates cache
 */
router.patch('/', async (req, res) => {
  try {
    // Generate unique request ID for tracing
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Log incoming request details
    logger.info(`[PATCH /api/sustainability] Request received [${reqId}]`, {
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      certificationIdsRaw: req.body?.certificationIds,
      certificationIdsType: typeof req.body?.certificationIds,
      bodySize: JSON.stringify(req.body || {}).length
    });
    
    // Input validation with Zod
    // CHUNK 1: Updated all string fields to accept nullable values
    const updateSchema = z.object({
      title: z.string().min(1).optional(),
      headline: z.string().nullable().optional(),
      subheadline: z.string().nullable().optional(),
      content: z.string().nullable().optional(),
      sectionType: z.string().min(1).optional(),
      data: z.record(z.string(), z.any()).optional(),
      metrics: z.record(z.string(), z.any()).optional(),
      ctaText: z.string().nullable().optional(),
      ctaLink: z.string().nullable().optional(),
      metricsTitle: z.string().nullable().optional(),
      metricsDescription: z.string().nullable().optional(),
      certificationsTitle: z.string().nullable().optional(),
      certificationsDescription: z.string().nullable().optional(),
      certificationsFooterNote: z.string().nullable().optional(),
      certificationIds: z.array(z.number()).nullable().optional(),
      initiativesTitle: z.string().nullable().optional(),
      initiativesDescription: z.string().nullable().optional(),
      goalsTitle: z.string().nullable().optional(),
      goalsDescription: z.string().nullable().optional(),
      fabricPortfolioTitle: z.string().nullable().optional(),
      fabricPortfolioDescription: z.string().nullable().optional(),
      featuresTitle: z.string().nullable().optional(),
      featuresDescription: z.string().nullable().optional(),
      callToActionTitle: z.string().nullable().optional(),
      callToActionDescription: z.string().nullable().optional(),
      callToActionButtonText: z.string().nullable().optional(),
      callToActionButtonLink: z.string().nullable().optional(),
      buttonText: z.string().nullable().optional(),
      buttonLink: z.string().nullable().optional(),
      backgroundImageId: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    });

    let validatedData;
    try {
      validatedData = updateSchema.parse(req.body);
      logger.info(`[Sustainability] ✅ Validation successful [${reqId}]`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error(`[Sustainability] ❌ Zod Validation Failed [${reqId}]`, {
          timestamp: new Date().toISOString(),
          requestId: reqId,
          issues: err.issues,
          rawBody: req.body,
          fieldCount: Object.keys(req.body || {}).length,
          errorCount: err.issues.length
        });
      }
      throw err;
    }
    
    logger.info(`[Sustainability] PATCH request - updating config [${reqId}]`);
    
    // Update in database with timeout protection
    const updated = await withTimeout(
      getStorage().updateUnifiedSustainability(validatedData),
      10000,
      'Update unified sustainability config'
    );
    
    if (!updated) {
      logger.warn(`[Sustainability] Update failed - no record updated [${reqId}]`);
      return res.status(404).json({
        success: false,
        error: {
          message: 'Sustainability configuration not found or could not be updated'
        }
      });
    }
    
    // Log successful save with persisted data
    logger.info(`[Sustainability] ✅ Save successful [${reqId}]`, {
      savedFields: Object.keys(validatedData),
      certificationIds: updated.certificationIds,
      backgroundImageId: updated.backgroundImageId,
      ctaText: updated.ctaText,
      ctaLink: updated.ctaLink,
      recordId: updated.id
    });
    
    // Invalidate cache
    const cacheKey = CacheKeys.sustainability.unified();
    await unifiedCache.delete(cacheKey);
    logger.info(`[Sustainability] ✅ Cache invalidated after update [${reqId}]`);
    
    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('[Sustainability] Validation error:', error.issues);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          details: error.issues
        }
      });
    }
    
    logger.error('[Sustainability] Error updating config:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update sustainability config'
      }
    });
  }
});

/**
 * PHASE 4: Cache warming now handled by CacheWarmupRegistry
 * Old HTTP-based warming removed in favor of centralized warming system
 * See: server/lib/cache-warmup-registry.ts -> sustainabilityUnified
 */

export default router;
