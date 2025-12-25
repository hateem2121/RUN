import type { Request, Response } from "express";
import type { SuccessEnvelope } from "../../shared/contracts/envelopes.js";
import { correlationContext } from "../lib/smart-logger.js";

/**
 * Sends a standardized success response.
 * @param res Express Response object
 * @param data Payload
 * @param statusCode HTTP Status (default 200)
 * @param meta Additional metadata
 */
export const sendSuccess = <T>(
  req: Request,
  res: Response,
  data: T,
  statusCode = 200,
  meta: Record<string, unknown> = {},
): Response => {
  const requestId =
    (req as unknown as { id: string }).id || correlationContext.getStore() || "unknown";

  const envelope: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: Date.now(),
      ...meta,
    },
  };

  return res.status(statusCode).json(envelope);
};
