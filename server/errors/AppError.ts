/**
 * @deprecated This file is deprecated. Import from '../lib/errors.js' instead.
 *
 * This file is kept for backward compatibility only.
 * All error classes are now consolidated in server/lib/errors.ts
 *
 * Migration:
 * - import { AppError, ValidationError, ... } from '../lib/errors.js';
 *
 * @see ../lib/errors.ts for the canonical error hierarchy
 */

// Re-export all error classes from canonical source for backward compatibility
export {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  BadRequestError,
  InternalError,
  DatabaseTimeoutError,
  DatabaseDeadlockError,
} from "../lib/errors.js";

// Legacy aliases for backward compatibility
export { AuthenticationError as UnauthorizedError } from "../lib/errors.js";
