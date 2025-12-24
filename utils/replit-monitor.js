/**
 * Replit-Native Monitoring Utilities
 * Leverages Replit environment variables and native database for error tracking
 */
import { getSharedKV } from "../server/lib/unified-replit-cache.js";
/**
 * Get Replit environment information
 */
export const getReplitEnvironment = () => {
	return {
		replId: process.env.REPL_ID || "unknown",
		replOwner: process.env.REPL_OWNER || "unknown",
		replSlug: process.env.REPL_SLUG || "unknown",
		isDevelopment: process.env.NODE_ENV === "development",
		hasDatabase: !!process.env.REPLIT_DB_URL,
	};
};
/**
 * Log TypeScript-related errors with Replit context
 */
export const logTypeError = (error, context, severity = "medium") => {
	const env = getReplitEnvironment();
	const errorData = {
		message: error.message,
		stack: error.stack,
		context,
		timestamp: new Date().toISOString(),
		replId: env.replId,
		replOwner: env.replOwner,
		replSlug: env.replSlug,
		errorType: "TYPE_ERROR",
		severity,
	};
	// Store in Replit Database for persistence (if available)
	if (env.hasDatabase) {
		storeErrorInDatabase(errorData).catch((dbError) => {});
	}
	// In development, show more detailed information
	if (env.isDevelopment) {
	}
};
/**
 * Log schema validation errors
 */
export const logSchemaError = (
	data,
	validationErrors,
	context,
	severity = "high",
) => {
	const env = getReplitEnvironment();
	const errorData = {
		message: `Schema validation failed: ${validationErrors.join(", ")}`,
		context: `${context} - Validation failed for: ${JSON.stringify(data).slice(0, 200)}...`,
		timestamp: new Date().toISOString(),
		replId: env.replId,
		replOwner: env.replOwner,
		replSlug: env.replSlug,
		errorType: "SCHEMA_ERROR",
		severity,
	};
	if (env.hasDatabase) {
		storeErrorInDatabase(errorData).catch((dbError) => {});
	}
};
/**
 * Store error in Replit Database
 */
const storeErrorInDatabase = async (errorData) => {
	try {
		// CRITICAL FIX: Use shared DB instance instead of creating new connection
		const db = getSharedKV();
		const errorKey = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		await db.set(errorKey, errorData);
		// Clean up old errors (keep last 100)
		try {
			const allErrorKeys = await db.list("error_");
			if (Array.isArray(allErrorKeys) && allErrorKeys.length > 100) {
				const oldKeys = allErrorKeys.slice(0, allErrorKeys.length - 100);
				for (const key of oldKeys) {
					await db.delete(key);
				}
			}
		} catch (error) {}
	} catch (error) {}
};
/**
 * Performance monitoring for media operations
 */
export const trackPerformance = async (operation, context, asyncFunction) => {
	const startTime = Date.now();
	let success = false;
	try {
		const result = await asyncFunction();
		success = true;
		return result;
	} catch (error) {
		success = false;
		throw error;
	} finally {
		const duration = Date.now() - startTime;
		const metric = {
			operation,
			duration,
			context,
			timestamp: new Date().toISOString(),
			success,
		};
		// Log performance metrics
		if (duration > 1000) {
		} else if (getReplitEnvironment().isDevelopment) {
		}
	}
};
/**
 * Create error boundary wrapper for media components
 */
export const createErrorBoundary = (componentName) => {
	return (error, errorInfo) => {
		logTypeError(error, `ErrorBoundary: ${componentName}`, "critical");
	};
};
/**
 * Monitor schema drift in real-time
 */
export const monitorSchemaDrift = (expectedFields, actualData, context) => {
	if (!Array.isArray(actualData) || actualData.length === 0) {
		return;
	}
	const sampleItem = actualData[0];
	const actualFields = Object.keys(sampleItem);
	// Check for missing fields
	const missingFields = expectedFields.filter(
		(field) => !actualFields.includes(field),
	);
	// Check for unexpected fields
	const unexpectedFields = actualFields.filter(
		(field) => !expectedFields.includes(field),
	);
	if (missingFields.length > 0 || unexpectedFields.length > 0) {
		const driftMessage = [
			missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : "",
			unexpectedFields.length > 0
				? `Unexpected: ${unexpectedFields.join(", ")}`
				: "",
		]
			.filter(Boolean)
			.join(" | ");
		logSchemaError(
			sampleItem,
			[`Schema drift detected: ${driftMessage}`],
			`Schema Drift Monitor: ${context}`,
			missingFields.length > 0 ? "critical" : "medium",
		);
	}
};
/**
 * Health check for media system
 */
export const healthCheck = async () => {
	const checks = [];
	// Check Replit Database connectivity
	try {
		// CRITICAL FIX: Use shared DB instance instead of creating new connection
		const db = getSharedKV();
		await db.get("health_check_test");
		checks.push({ name: "Database", status: true });
	} catch (error) {
		checks.push({
			name: "Database",
			status: false,
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
	// Check environment variables
	const env = getReplitEnvironment();
	checks.push({
		name: "Environment",
		status: env.replId !== "unknown" && env.replOwner !== "unknown",
	});
	// Determine overall status
	const failedChecks = checks.filter((check) => !check.status);
	const status =
		failedChecks.length === 0
			? "healthy"
			: failedChecks.length <= 1
				? "degraded"
				: "unhealthy";
	return { status, checks };
};
/**
 * Generate system status report
 */
export const generateStatusReport = async () => {
	const environment = getReplitEnvironment();
	const health = await healthCheck();
	// Get recent error count
	let recentErrors = 0;
	if (environment.hasDatabase) {
		try {
			// CRITICAL FIX: Use shared DB instance instead of creating new connection
			const db = getSharedKV();
			const errorKeys = await db.list("error_");
			// Count errors from last hour
			if (Array.isArray(errorKeys)) {
				const oneHourAgo = Date.now() - 60 * 60 * 1000;
				recentErrors = errorKeys.filter((key) => {
					const timestamp = parseInt(key.split("_")[1]);
					return timestamp > oneHourAgo;
				}).length;
			}
		} catch (error) {}
	}
	return {
		environment,
		health,
		recentErrors,
		uptime: process.uptime() * 1000, // Convert to milliseconds
	};
};
