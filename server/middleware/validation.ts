import type { NextFunction, Request, Response } from "express";
import { ZodError, type z } from "zod";
import { ValidationError } from "../errors/AppError.js";

// Validation wrapper for Request Body
export const validateBody =
  (schema: z.ZodSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Use parseAsync to handle both sync and async schemas uniformly
      const data = await schema.parseAsync(req.body);
      // Replace body with parsed data (handles transformations)
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        const errors = (error as any).errors || [];
        errors.forEach((err: any) => {
          const key = err.path.join(".");
          if (!details[key]) details[key] = [];
          details[key].push(err.message);
        });
        next(new ValidationError("Validation Failed", details));
      } else {
        next(error);
      }
    }
  };

// Validation wrapper for Request Params
export const validateParams =
  (schema: z.ZodSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema) {
        // Use parseAsync to handle both sync and async schemas uniformly
        const result = await schema.safeParseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (!result.success) {
          const errorMessages = (result.error as any).errors.map(
            (err: any) => `${err.path.join(".")}: ${err.message}`,
          );
          throw new Error(`Validation failed: ${errorMessages.join(", ")}`);
        }
        Object.assign(req, result.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  };

// Validation wrapper for Request Query
export const validateQuery =
  (schema: z.ZodSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
        // Use parseAsync to handle both sync and async schemas uniformly
      const parsed = await schema.parseAsync(req.query);

      // Fix: req.query might be a getter-only property in some environments
      try {
        req.query = parsed as any;
      } catch (_e) {
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as any;
        const errorMessages = zodError.errors
          ? zodError.errors.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            }))
          : [{ message: zodError.message }];

        const validationError = new Error("Validation Failed");
        (validationError as any).statusCode = 400;
        (validationError as any).details = errorMessages;
        next(validationError);
      } else {
        next(error);
      }
    }
  };

// Alias for generic usage (defaults to body validation)
export const validate = validateBody;
