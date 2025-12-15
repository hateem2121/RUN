/**
 * REQUEST TIMEOUT UTILITY
 * Centralized timeout wrapper for async operations
 * Prevents hanging requests and provides consistent timeout behavior
 */

/**
 * Wraps a promise with a timeout to prevent hanging requests
 * @param promise - The promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms = 10s)
 * @param operation - Description of the operation for error messages
 * @returns Promise that rejects if timeout is reached
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}
