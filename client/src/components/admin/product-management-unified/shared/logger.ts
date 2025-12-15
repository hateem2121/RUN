/**
 * Lightweight debug logger for admin products
 * Replaces console.log with structured logging
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AdminProducts] ${message}`, data ? data : '');
    }
  },
  
  info: (message: string, data?: Record<string, unknown>) => {
    console.info(`[AdminProducts] ${message}`, data ? data : '');
  },
  
  error: (message: string, error?: Error | unknown) => {
    console.error(`[AdminProducts] ${message}`, error ? error : '');
  }
};