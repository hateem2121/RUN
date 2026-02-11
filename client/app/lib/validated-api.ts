import type { z } from "zod";
import { apiRequest } from "./api";
import { createSuccessEnvelopeSchema } from "./schemas/response-envelopes";

export class ResponseValidationError extends Error {
  public validationError: z.ZodError;

  constructor(message: string, validationError: z.ZodError) {
    super(message);
    this.name = "ResponseValidationError";
    this.validationError = validationError;
  }
}

/**
 * Validated API RequestWrapper
 *
 * Fetches data via apiRequest and validates the response against a Zod schema.
 * Unwraps the standardized SuccessEnvelope to return the inner data.
 *
 * @param url API Endpoint URL
 * @param schema Zod schema for the expected inner data (T)
 * @param options Request options
 * @returns Promise<T> The validated inner data
 * @throws ResponseValidationError if validation fails
 * @throws ApiError if the request fails (4xx/5xx)
 */
export async function validatedApiRequest<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: { method?: string; body?: BodyInit | null; headers?: Record<string, string> },
): Promise<T> {
  // 1. Fetch data (throws ApiError on non-2xx)
  const response = await apiRequest(url, options);

  // 2. Wrap the data schema in the standard envelope
  const envelopeSchema = createSuccessEnvelopeSchema(schema);

  // 3. Validate response shape
  const result = envelopeSchema.safeParse(response);

  if (!result.success) {
    throw new ResponseValidationError(
      `API contract violation: Invalid response shape from ${url}`,
      result.error,
    );
  }

  // 4. Return unwrapped data
  return result.data.data;
}
