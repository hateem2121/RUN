import { logger } from '../lib/smart-logger.js';
// Production-Grade Error Handling
// PHASE 4: Production Readiness - Error Management

import { Request, Response } from 'express';
import { getConfig } from '../config/production.js';
import { errorAggregator } from '../lib/error-aggregator.js';

const config = getConfig();

// Error Classification
interface ErrorDetails {
  id: string;
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'rate_limit' | 'internal' | 'database' | 'external_service';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userAgent?: string;
  ip?: string;
  path: string;
  method: string;
}

// Generate unique error ID for tracking - safe for database integer compatibility
function generateErrorId(): string {
  // Use compact timestamp approach to stay within safe integer ranges
  const epochStart = new Date('2020-01-01').getTime();
  const compactTimestamp = Math.floor((Date.now() - epochStart) / 1000);
  const randomSuffix = Math.floor(Math.random() * 99999);
  return `err_${compactTimestamp}${randomSuffix.toString().padStart(5, '0')}`;
}

// Classify error type and severity
function classifyError(error: unknown, req: Request): ErrorDetails {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();
  const path = req.path;
  const method = req.method;
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;

  let type: ErrorDetails['type'] = 'internal';
  let severity: ErrorDetails['severity'] = 'medium';

  // Classify by error properties
  const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
    type = 'external_service';
    severity = 'high';
  } else if (error instanceof Error && (error.message?.includes('database') || error.message?.includes('SQL'))) {
    type = 'database';
    severity = 'high';
  } else if (error && typeof error === 'object' && ('status' in error || 'statusCode' in error)) {
    const status = ('status' in error ? error.status : 'statusCode' in error ? error.statusCode : 0) as number;
    if (status === 404) {
      type = 'not_found';
      severity = 'low';
    } else if (status === 401) {
      type = 'authentication';
      severity = 'medium';
    } else if (status === 403) {
      type = 'authorization';
      severity = 'medium';
    } else if (status === 429) {
      type = 'rate_limit';
      severity = 'low';
    } else if (status >= 400 && status < 500) {
      type = 'validation';
      severity = 'low';
    }
  } else {
    type = 'internal';
    severity = 'critical';
  }

  return {
    id: errorId,
    type,
    severity,
    timestamp,
    userAgent,
    ip,
    path,
    method
  };
}

// Error logging with different levels
function logError(error: unknown, details: ErrorDetails) {
  const logLevel = config.monitoring.logLevel;

  // DEBUG: Write to file
  try {
    const fs = require('fs');
    const logEntry = `[${new Date().toISOString()}] ${details.type.toUpperCase()} (${details.id}): ${error instanceof Error ? error.message : 'Unknown error'}\nStack: ${error instanceof Error ? error.stack : 'No stack'}\n\n`;
    fs.appendFileSync('error.log', logEntry);
  } catch (e) {
    // ignore
  }

  // Record error in aggregator for metrics
  errorAggregator.recordError({
    id: details.id,
    type: details.type,
    severity: details.severity,
    message: error instanceof Error ? error.message : 'Unknown error',
    timestamp: details.timestamp,
    path: details.path,
    method: details.method,
    ip: details.ip,
    userAgent: details.userAgent,
    stack: config.app.enableDebugMode && error instanceof Error ? error.stack : undefined
  });

  // Always log critical and high severity errors
  if (details.severity === 'critical' || details.severity === 'high') {
    logger.error(`[ERROR ${details.id}] ${details.type.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`[ERROR ${details.id}] Path: ${details.method} ${details.path}`);
    logger.error(`[ERROR ${details.id}] IP: ${details.ip}`);

    if (config.app.enableDebugMode && error instanceof Error) {
      logger.error(`[ERROR ${details.id}] Stack:`, error.stack);
    }
  }

  // Log medium severity in development and staging
  else if (details.severity === 'medium' && (logLevel === 'info' || logLevel === 'debug')) {
    logger.warn(`[WARN ${details.id}] ${details.type}: ${error instanceof Error ? error.message : 'Unknown error'} (${details.path})`);
  }

  // Log low severity only in debug mode
  else if (details.severity === 'low' && logLevel === 'debug') {
    logger.info(`[INFO ${details.id}] ${details.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate user-friendly error responses
function generateErrorResponse(error: unknown, details: ErrorDetails): Record<string, unknown> {
  const baseResponse = {
    error: true,
    id: details.id,
    timestamp: details.timestamp,
    type: details.type
  };

  // Production responses (minimal information)
  if (config.app.environment === 'production') {
    switch (details.type) {
      case 'validation':
        return {
          ...baseResponse,
          message: 'Invalid request data',
          status: 400
        };
      case 'authentication':
        return {
          ...baseResponse,
          message: 'Authentication required',
          status: 401
        };
      case 'authorization':
        return {
          ...baseResponse,
          message: 'Access denied',
          status: 403
        };
      case 'not_found':
        return {
          ...baseResponse,
          message: 'Resource not found',
          status: 404
        };
      case 'rate_limit':
        return {
          ...baseResponse,
          message: 'Too many requests',
          status: 429
        };
      case 'database':
      case 'external_service':
      case 'internal':
      default:
        return {
          ...baseResponse,
          message: 'Internal server error',
          status: 500
        };
    }
  }

  // Development/staging responses (more detailed)
  else {
    const status = error && typeof error === 'object' && ('status' in error || 'statusCode' in error)
      ? (('status' in error ? error.status : 'statusCode' in error ? error.statusCode : 500) as number)
      : 500;
    return {
      ...baseResponse,
      message: error instanceof Error ? error.message : 'An error occurred',
      status,
      ...(config.app.enableDebugMode && error instanceof Error && {
        stack: error.stack,
        details: error
      })
    };
  }
}

// Main error handling middleware
export function productionErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // next: NextFunction
) {
  // Classify and log the error
  const errorDetails = classifyError(error, req);
  logError(error, errorDetails);

  // Generate appropriate response
  const errorResponse = generateErrorResponse(error, errorDetails);

  // Set response headers
  res.setHeader('X-Error-ID', errorDetails.id);
  res.setHeader('X-Error-Type', errorDetails.type);

  // Send error response
  if (!res.headersSent) {
    res.status(Number(errorResponse.status)).json(errorResponse);
  }
}

// 404 Handler
export function notFoundHandler(req: Request, res: Response) {
  const errorDetails = {
    id: generateErrorId(),
    type: 'not_found' as const,
    severity: 'low' as const,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Record 404 in error aggregator
  errorAggregator.recordError({
    id: errorDetails.id,
    type: errorDetails.type,
    severity: errorDetails.severity,
    message: `Resource not found: ${req.method} ${req.path}`,
    timestamp: errorDetails.timestamp,
    path: errorDetails.path,
    method: errorDetails.method,
    ip: errorDetails.ip,
    userAgent: errorDetails.userAgent
  });

  if (config.monitoring.logLevel === 'debug') {
    logger.info(`[404 ${errorDetails.id}] ${req.method} ${req.path}`);
  }

  res.status(404).json({
    error: true,
    id: errorDetails.id,
    type: 'not_found',
    message: config.app.environment === 'production'
      ? 'Resource not found'
      : `Path ${req.path} not found`,
    timestamp: errorDetails.timestamp
  });
}

// Unhandled promise rejection handler
export function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[CRITICAL] Unhandled Promise Rejection:', reason);
    logger.error('[CRITICAL] Promise:', promise);

    // In production, we might want to restart the process
    if (config.app.environment === 'production') {
      logger.error('[CRITICAL] Process may need restart due to unhandled rejection');
      // Don't exit automatically in Replit - let it handle gracefully
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error('[CRITICAL] Uncaught Exception:', error);

    // In production, log and gracefully shut down
    if (config.app.environment === 'production') {
      logger.error('[CRITICAL] Process must restart due to uncaught exception');
      // Don't exit automatically in Replit
    }
  });
}

// Extended error interface for rate limiting
interface RateLimitError extends Error {
  status: number;
  type: string;
}

// Rate limiting error helper
export function createRateLimitError(): RateLimitError {
  const error = new Error('Too many requests from this IP') as RateLimitError;
  error.status = 429;
  error.type = 'rate_limit';
  return error;
}