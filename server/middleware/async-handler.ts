import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Async Handler Middleware
 * Wraps async route handlers to automatically catch rejected promises
 * and forward them to Express error handling middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
