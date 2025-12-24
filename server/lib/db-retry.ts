/**
 * DATABASE RETRY LOGIC
 * Simple retry wrapper for database operations to handle transient failures
 * Uses exponential backoff for retry attempts
 */

import { logger } from './smart-logger.js';

interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  operationName?: string;
}

/**
 * Wraps a database operation with retry logic and exponential backoff
 * 
 * @param operation - Function that returns a Promise to execute
 * @param options - Retry configuration options
 * @returns Promise that resolves with the operation result or rejects after all retries fail
 * 
 * @example
 * ```typescript
 * const products = await withTimeout(
 *   retryDbOperation(() => getStorage().getProducts()),
 *   10000,
 *   'Get products'
 * );
 * ```
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMs = 50,
    operationName = 'Database operation'
  } = options;

  let lastError: Error | unknown;
  const totalAttempts = maxRetries + 1; // maxRetries=3 means 4 total attempts (1 initial + 3 retries)
  
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      // First attempt executes IMMEDIATELY (no delay)
      // Retries occur after exponential backoff delays
      const result = await operation();
      
      // Log successful retry if this wasn't the first attempt
      if (attempt > 1) {
        logger.info(`[DB Retry] ${operationName} succeeded on attempt ${attempt} after ${attempt - 1} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if this is a retryable database error
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt === totalAttempts) {
        // Log final failure with clear indication of why retries stopped
        const failureReason = !isRetryable 
          ? 'non-retryable error (logic/validation issue)' 
          : 'max retries exhausted';
        
        logger.error(`[DB Retry] ${operationName} failed: ${failureReason}`, {
          error: error instanceof Error ? error.message : String(error),
          retryable: isRetryable,
          attempts: attempt,
          totalRetries: attempt - 1,
          failureReason
        });
        throw error;
      }
      
      // Calculate exponential backoff delay: backoffMs * 2^(attempt-1)
      const delayMs = backoffMs * 2 ** (attempt - 1);
      const retriesSoFar = attempt - 1; // Number of retries we've already done
      const upcomingRetryNumber = attempt; // The retry we're about to perform
      
      logger.warn(`[DB Retry] ${operationName} failed (${retriesSoFar} retries so far), will perform retry #${upcomingRetryNumber} of ${maxRetries} after ${delayMs}ms`, {
        error: error instanceof Error ? error.message : String(error),
        nextRetryIn: delayMs,
        retriesSoFar: retriesSoFar,
        upcomingRetryNumber: upcomingRetryNumber,
        attemptNumber: attempt,
        maxRetries
      });
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Determines if an error is retryable based on its type and message
 * Retries connection errors, idle timeouts, and transient database errors
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const errorMessage = error.message.toLowerCase();
  
  // Common retryable database error patterns
  const retryablePatterns = [
    'connection',
    'timeout',
    'econnrefused',
    'econnreset',
    'epipe',
    'idle',
    'disconnect',
    'network',
    'unavailable',
    'too many connections',
    'deadlock'
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Sleep utility for backoff delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

logger.info('[DB Retry] Database retry logic initialized (maxRetries=3, backoffMs=50, exponential)');
