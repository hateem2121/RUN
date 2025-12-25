import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function nonceMiddleware(_req: Request, res: Response, next: NextFunction) {
  // Generate a fresh nonce for every request
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}
