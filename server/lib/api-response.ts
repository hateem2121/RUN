import type { Response } from "express";

/**
 * Standardized API Response Structure
 * P2 ARCHITECTURE: Consistent API Contract
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export const apiResponse = {
  success: <T>(
    res: Response,
    data?: T,
    statusCode = 200,
    meta?: ApiResponse["meta"],
  ) => {
    return res.status(statusCode).json({
      success: true,
      data,
      meta,
    } as ApiResponse<T>);
  },

  error: (
    res: Response,
    message: string,
    statusCode = 500,
    code?: string,
    details?: any,
  ) => {
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
