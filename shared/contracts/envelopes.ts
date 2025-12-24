/**
 * STANDARD API ENVELOPES
 *
 * This file defines the canonical shape of all API responses.
 * It is shared between the Client (for consumption) and Server (for production).
 */

/**
 * Standard Success Response
 * Used for all 2xx responses.
 */
export interface SuccessEnvelope<T = unknown> {
	success: true;
	data: T;
	meta?: {
		requestId: string;
		timestamp: number;
		[key: string]: unknown;
	};
}

/**
 * Standard Error Response
 * Used for all 4xx and 5xx responses.
 */
export interface ErrorEnvelope {
	success: false;
	error: {
		/**
		 * Broad category of the error (e.g., 'ValidationError', 'NotFoundError')
		 * Maps to AppError class names.
		 */
		type: string;

		/**
		 * Stable machine-readable code (e.g., 'INVALID_INPUT', 'RESOURCE_NOT_FOUND')
		 * Useful for frontend translation keys.
		 */
		code: string;

		/**
		 * Human-readable message, safe for UI display.
		 */
		message: string;

		/**
		 * Detailed validation errors or additional context.
		 * Record<Field, Message[]>
		 */
		details?: Record<string, string[] | string>;

		/**
		 * Correlation ID for debugging.
		 */
		requestId: string;

		/**
		 * Timestamp of the error.
		 */
		timestamp: number;
	};
}

/**
 * Union type for any API response.
 * Useful for type guards.
 */
export type ApiResponse<T = unknown> = SuccessEnvelope<T> | ErrorEnvelope;
