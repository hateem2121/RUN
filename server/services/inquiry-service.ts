/**
 * INQUIRY SERVICE
 * Handles business logic for contact form inquiries,
 * including statistics, caching, and state management.
 */

import { unifiedCache } from "../lib/cache/unified-cache.js";
import { logger } from "../lib/monitoring/logger.js";
import { getStorage } from "../lib/storage-singleton.js";

const CACHE_TTL_INQUIRIES = 300; // 5 minutes

export class InquiryService {
  /**
   * Lists inquiries with pagination and filters.
   */
  async listInquiries(params: {
    page?: number;
    limit?: number;
    status?: string | undefined;
    source?: string | undefined;
    search?: string | undefined;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    
    const result = await getStorage().listInquiries({
      page,
      limit,
      status: params.status,
      source: params.source,
      search: params.search,
    });

    return {
      inquiries: result.inquiries,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Fetches inquiry statistics with caching.
   */
  async getStats() {
    const cacheKey = "inquiries:stats";

    try {
      const cached = await unifiedCache.get<{
        byStatus: Record<string, number>;
        bySource: Record<string, number>;
        recentCount: number;
      }>(cacheKey);

      if (cached) {
        return { data: cached, fromCache: true };
      }

      const stats = await getStorage().getInquiryStats();
      const defaultStats = {
        byStatus: { new: 0, read: 0, responded: 0, archived: 0 },
        bySource: {},
        recentCount: 0,
      };

      const finalStats = stats || defaultStats;
      await unifiedCache.set(cacheKey, finalStats, CACHE_TTL_INQUIRIES * 1000);
      
      return { data: finalStats, fromCache: false };
    } catch (error) {
      logger.error("[InquiryService] Failed to fetch stats:", error);
      return {
        data: {
          byStatus: { new: 0, read: 0, responded: 0, archived: 0 },
          bySource: {},
          recentCount: 0,
        },
        fromCache: false,
        error: "Failed to fetch stats",
      };
    }
  }

  /**
   * Fetches a single inquiry by ID with caching.
   */
  async getInquiryById(id: number) {
    const cacheKey = `inquiries:detail:${id}`;

    const cached = await unifiedCache.get<any>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const inquiry = await getStorage().getInquiryById(id);
    if (!inquiry) return null;

    await unifiedCache.set(cacheKey, inquiry, CACHE_TTL_INQUIRIES * 1000);
    return { data: inquiry, fromCache: false };
  }

  /**
   * Updates an inquiry's status and notes, invalidating relevant caches.
   */
  async updateStatus(id: number, status: "new" | "read" | "responded" | "archived", adminNotes?: string) {
    const updated = await getStorage().updateInquiryStatus(id, status, adminNotes);
    if (!updated) return null;

    await this.invalidateInquiryCaches(id);
    logger.info(`[InquiryService] Inquiry #${id} status updated to ${status}`);
    
    return updated;
  }

  /**
   * Deletes an inquiry and invalidates relevant caches.
   */
  async deleteInquiry(id: number) {
    const deleted = await getStorage().deleteInquiry(id);
    if (!deleted) return false;

    await this.invalidateInquiryCaches(id);
    logger.info(`[InquiryService] Inquiry #${id} deleted`);
    
    return true;
  }

  /**
   * Helper to invalidate stats and detail caches.
   */
  private async invalidateInquiryCaches(id: number) {
    try {
      await unifiedCache.delete("inquiries:stats");
      await unifiedCache.delete(`inquiries:detail:${id}`);
    } catch (error) {
      logger.debug(`[InquiryService] Cache invalidation failed for #${id}:`, error);
    }
  }
}

export const inquiryService = new InquiryService();
