/**
 * Lightweight debug logger for admin products
 * Replaces console.log with structured logging
 */
export const logger = {
	debug: (message: string, data?: Record<string, unknown>) => {
		if (process.env.NODE_ENV === "development") {
		}
	},

	info: (message: string, data?: Record<string, unknown>) => {},

	error: (message: string, error?: Error | unknown) => {},
};
