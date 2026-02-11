import type { NextFunction, Request, Response } from "express";

/**
 * RESPONSE TRACKER MIDDLEWARE
 *
 * Problem: Express 5 async handlers trigger `next()` upon resolution. If the response
 * is buffered (e.g. by compression), `res.headersSent` remains false when the
 * 404 handler executes, causing a "headers already sent" crash or double-response.
 *
 * Solution: This middleware flags the request as `_handled` immediately when
 * `res.json`, `res.send`, or `res.end` is called, providing a synchronous
 * signal that a response is in progress.
 */
export function responseTracker(_req: Request, res: Response, next: NextFunction) {
  // Initialize the flag
  res.locals._handled = false;

  // Skip for static assets to avoid stream interference
  if (/\.(jpg|jpeg|png|webp|gif|mp4|webm|glb|gltf|woff|woff2|ttf|eot|otf|ico)$/i.test(_req.path)) {
    return next();
  }

  // Monkey-patch res.json
  const originalJson = res.json;
  res.json = function (body) {
    res.locals._handled = true;
    return originalJson.call(this, body);
  };

  // Monkey-patch res.send
  const originalSend = res.send;
  res.send = function (body) {
    res.locals._handled = true;
    return originalSend.call(this, body);
  };

  // Monkey-patch res.end
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: unknown[]) {
    res.locals._handled = true;
    return originalEnd.apply(this, args as [any, BufferEncoding, (() => void) | undefined]);
  } as unknown as typeof res.end;

  next();
}
