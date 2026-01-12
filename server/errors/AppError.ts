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
// Legacy aliases for backward compatibility
export {
  AppError,
  AuthenticationError,
  AuthenticationError as UnauthorizedError,
  BadRequestError,
  ConflictError,
  DatabaseDeadlockError,
  DatabaseError,
  DatabaseTimeoutError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../lib/errors.js";
