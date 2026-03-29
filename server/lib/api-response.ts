import type { Response } from "express";

/**
 * Standardized API Response Structure
 * P2 ARCHITECTURE: Consistent API Contract
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export const apiResponse = {
  success: <T>(res: Response, data?: T, statusCode = 200, meta?: ApiResponse["meta"]) => {
    return res.status(statusCode).json({
      success: true,
      data,
      meta,
    } as ApiResponse<T>);
  },

  error: (res: Response, message: string, statusCode = 500, code?: string, details?: unknown) => {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ApiResponse);
  },
};
