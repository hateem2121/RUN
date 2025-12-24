import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { ErrorEnvelope } from "../../shared/contracts/envelopes.js";
import {
	AppError,
	InternalError,
	ValidationError,
} from "../errors/AppError.js";
import { correlationContext, logger } from "../lib/smart-logger.js";
import { mapDrizzleError } from "../utils/drizzle-error-mapper.js";

export const globalErrorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (res.headersSent) {
		return _next(err);
	}

	const requestId =
		(req as unknown as { id: string }).id ||
		correlationContext.getStore() ||
		"unknown";
	let error: AppError;

	// 1. Normalize Error
	if (err instanceof AppError) {
		error = err;
	} else if (err instanceof ZodError) {
		// Fallback for manual Zod parsing in legacy controllers
		const details: Record<string, string[]> = {};
		err.issues.forEach((e) => {
			const key = e.path.join(".");
			if (!details[key]) details[key] = [];
			details[key].push(e.message);
		});
		error = new ValidationError("Validation Failed", details);
	} else if ((err as any).code && (err as any).routine) {
		// Postgres/Drizzle Error (detected by code + routine existence)
		error = mapDrizzleError(err, "GlobalErrorHandler");
	} else if (err instanceof Error) {
		// Unhandled exception
		logger.error(
			"Unhandled Exception caught in global handler",
			{ requestId, url: req.url },
			err,
		);
		// HARDENING: Start
		const message =
			process.env.NODE_ENV === "production"
				? "An unexpected error occurred."
				: err.message;
		error = new InternalError(message);
		// HARDENING: End
	} else {
		// Unknown object thrown
		logger.error(
			"Unknown error object caught",
			{ requestId },
			new Error(String(err)),
		);
		error = new InternalError("An unexpected error occurred");
	}

	// 2. Log if it's an operational error (warn) or critical (error)
	// We already logged 500s above.
	if (error.statusCode < 500) {
		logger.warn(`Operational Error: ${error.message}`, {
			statusCode: error.statusCode,
			code: error.errorCode,
			requestId,
			url: req.url,
			method: req.method,
			details: error.details,
		});
	}

	// 2b. Enrich Sentry context
	Sentry.setContext("error_metadata", {
		code: error.errorCode,
		requestId,
		isOperational: error.isOperational,
		...((error.metadata as Record<string, unknown>) || {}),
	});

	if (error.details) {
		Sentry.setContext("validation_errors", error.details);
	}

	// 3. Construct Envelope
	const response: ErrorEnvelope = {
		success: false,
		error: {
			type: error.constructor.name,
			code: error.errorCode,
			message: error.message,
			details: error.details,
			requestId,
			timestamp: Date.now(),
		},
	};

	// 4. Send
	res.status(error.statusCode).json(response);
};
