/**
 * INQUIRY ADMIN ROUTES MODULE
 * Admin endpoints for managing contact form inquiries
 * Created: October 22, 2025
 */

import express from "express";
import { z } from "zod";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { unifiedCache } from "../../lib/unified-cache.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = express.Router();

const CACHE_TTL_INQUIRIES = 300;

const updateStatusSchema = z.object({
	status: z.enum(["new", "read", "responded", "archived"]),
	adminNotes: z.string().max(1000).optional(),
});

router.get(
	"/admin/inquiries",
	asyncHandler(async (req, res) => {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const status = req.query.status as string | undefined;
		const source = req.query.source as string | undefined;
		const search = req.query.search as string | undefined;

		const storage = getStorage();
		const result = await storage.listInquiries({
			page,
			limit,
			status,
			source,
			search,
		});

		const response = {
			inquiries: result.inquiries,
			total: result.total,
			page,
			limit,
			totalPages: Math.ceil(result.total / limit),
		};

		return res.json(response);
	}),
);

router.get(
	"/admin/inquiries/stats",
	asyncHandler(async (_req, res) => {
		const cacheKey = "inquiries:stats";

		const cached = await unifiedCache.get<{
			byStatus: Record<string, number>;
			bySource: Record<string, number>;
			recentCount: number;
		}>(cacheKey);

		if (cached) {
			logger.debug("[Inquiries] Returning cached inquiry stats");
			res.setHeader("X-Cache-Hit", "true");
			return res.json(cached);
		}

		const storage = getStorage();
		const stats = await storage.getInquiryStats();

		await unifiedCache.set(cacheKey, stats, CACHE_TTL_INQUIRIES * 1000);
		logger.debug(
			`[Inquiries] Inquiry stats cached for ${CACHE_TTL_INQUIRIES}s`,
		);

		return res.json(stats);
	}),
);

router.get(
	"/admin/inquiries/:id",
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id!);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid inquiry ID" });
		}

		const cacheKey = `inquiries:detail:${id}`;

		const cached = await unifiedCache.get<any>(cacheKey);
		if (cached) {
			logger.debug("[Inquiries] Returning cached inquiry detail");
			res.setHeader("X-Cache-Hit", "true");
			return res.json(cached);
		}

		const storage = getStorage();
		const inquiry = await storage.getInquiryById(id);

		if (!inquiry) {
			return res.status(404).json({ error: "Inquiry not found" });
		}

		const cacheValue = inquiry as any;
		await unifiedCache.set(cacheKey, cacheValue, CACHE_TTL_INQUIRIES * 1000);
		logger.debug(
			`[Inquiries] Inquiry detail cached for ${CACHE_TTL_INQUIRIES}s`,
		);

		return res.json(inquiry);
	}),
);

router.patch(
	"/admin/inquiries/:id/status",
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id!);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid inquiry ID" });
		}

		const validatedData = updateStatusSchema.parse(req.body);

		const storage = getStorage();
		const updated = await storage.updateInquiryStatus(
			id,
			validatedData.status,
			validatedData.adminNotes ?? undefined,
		);

		if (!updated) {
			return res.status(404).json({ error: "Inquiry not found" });
		}

		try {
			await unifiedCache.delete("inquiries:stats");
			await unifiedCache.delete(`inquiries:detail:${id}`);
		} catch (error) {
			logger.debug("[Inquiries] Failed to invalidate inquiry cache:", error);
		}

		logger.info(
			`[Inquiries] Inquiry #${id} status updated to ${validatedData.status}`,
		);

		const result = updated as any;
		return res.json(result);
	}),
);

router.delete(
	"/admin/inquiries/:id",
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id!);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid inquiry ID" });
		}

		const storage = getStorage();
		const deleted = await storage.deleteInquiry(id);

		if (!deleted) {
			return res.status(404).json({ error: "Inquiry not found" });
		}

		try {
			await unifiedCache.delete("inquiries:stats");
			await unifiedCache.delete(`inquiries:detail:${id}`);
		} catch (error) {
			logger.debug("[Inquiries] Failed to invalidate inquiry cache:", error);
		}

		logger.info(`[Inquiries] Inquiry #${id} deleted`);

		return res.json({ success: true, message: "Inquiry deleted successfully" });
	}),
);

logger.debug(
	"[Inquiry Admin Routes] ✅ Inquiry admin routes loaded (utilities/)",
);

export default router;
