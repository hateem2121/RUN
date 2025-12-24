/**
 * Lightweight debug logger for admin products
 * Replaces console.log with structured logging
 */
export const logger = {
  debug: (_message: string, _data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
    }
  },

  info: (_message: string, _data?: Record<string, unknown>) => {},

  error: (_message: string, _error?: Error | unknown) => {},
};
