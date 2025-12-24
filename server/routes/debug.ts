import crypto from "crypto";
import { sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";
import { logger } from "../lib/smart-logger.js";

const router = Router();

// SAFETY HEAD: Double-check env vars in case of logic error in index.ts
router.use((req, res, next) => {
	// 1. Env & Gate Check
	if (
		process.env.NODE_ENV === "production" ||
		process.env.ENABLE_DEBUG_ROUTES !== "true"
	) {
		res.status(404).json({ error: "Debug routes invalid configuration" });
		return;
	}

	// 2. Token Gate (Defense in Depth)
	// Must match X-RUN-DEBUG-TOKEN header
	logger.info(
		`[Debug] Incoming request from ${req.ip}. X-Forwarded-For: ${req.headers["x-forwarded-for"]}`,
	);
	const token = req.headers["x-run-debug-token"];
	const expectedToken = process.env.DEBUG_ROUTE_TOKEN;

	// FAIL CLOSED if token is not configured on server
	if (!expectedToken) {
		logger.error(
			"[Debug] ⚠️  Debug routes enabled but DEBUG_ROUTE_TOKEN is missing. Blocking all access.",
		);
		res.status(500).json({ error: "Server misconfiguration" });
		return;
	}

	// Timing-safe comparison to prevent timing attacks
	const tokenBuf = Buffer.from(String(token || ""));
	const expectedBuf = Buffer.from(expectedToken);
	let isValid = false;

	try {
		if (tokenBuf.length === expectedBuf.length) {
			isValid = crypto.timingSafeEqual(tokenBuf, expectedBuf);
		}
	} catch (e) {
		isValid = false;
	}

	if (!isValid) {
		logger.warn(`[Debug] ⛔ Blocked unauthorized debug access from ${req.ip}`);
		res.status(404).json({ error: "Not found" });
		return;
	}

	// 3. Network Guard (Localhost Only by default)
	// Unless explicitly allowed via DEBUG_ROUTE_ALLOWLIST
	const allowList = process.env.DEBUG_ROUTE_ALLOWLIST;
	// Use socket address for physical connection "truth" to compare against localhost.
	// This bypasses 'trust proxy' headers, preventing IP spoofing via X-Forwarded-For.
	const ip = req.socket.remoteAddress || "";

	// IPv4 127.0.0.1, IPv6 ::1, IPv4-mapped ::ffff:127.0.0.1
	const isLocal =
		ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1";

	if (!allowList && !isLocal) {
		logger.warn(`[Debug] ⛔ Blocked non-local debug access from ${ip}`);
		res.status(404).json({ error: "Not found" });
		return;
	}

	next();
});

/**
 * POST /api/debug/crash
 * Triggers an uncaught exception or unhandled rejection to verify "Crash-Only" behavior.
 * Query param ?type=reject triggers unhandled rejection. Default is uncaught exception.
 */
router.post("/crash", (req, res) => {
	const type = req.query.type;

	logger.warn("[Debug] Triggering intentional process crash...", { type });

	// Create a delay to ensure the response might start (or log flushes) but the process MUST die.
	// Actually, for "Crash-Only", we should just crash.
	// We send a 202 Accepted to acknowledge receipt if possible, but the goal is the crash.

	if (type === "reject") {
		// Unhandled Rejection
		const err = new Error("Simulated Unhandled Rejection (Integration Test)");
		process.emit("unhandledRejection", err, Promise.reject(err));
	} else {
		// Uncaught Exception
		// Manually exit to verify process termination infrastructure
		// (Simulating the end result of an uncaught exception handler)
		logger.error("DEBUG: Manually exiting process for crash test");
		process.exit(1);
	}

	// If we get here, valid "crash scheduled" response
	res.status(202).json({ message: "Crash scheduled" });
});

/**
 * POST /api/debug/slow-query
 * Executes a deterministic slow query (pg_sleep) to verify observability logs.
 */
router.post("/slow-query", async (req, res) => {
	const duration = req.query.duration
		? parseFloat(req.query.duration as string)
		: 1.2;
	logger.info(`[Debug] Triggering slow query of ${duration}s...`);

	// Use raw SQL execution to bypass any ORM caching if present, ensuring it hits the driver
	// and thus our 'trackedSql' proxy in db.ts
	const query = sql.raw(`SELECT pg_sleep(${duration})`);

	await db.execute(query);

	res.json({ message: "Slow query execution complete", duration });
});

export default router;
