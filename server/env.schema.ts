import { z } from "zod";

export const envSchema = z.object({
  // Core Configuration
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(5001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),

  // Authentication
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  INITIAL_ADMIN_EMAIL: z.string().email("INITIAL_ADMIN_EMAIL must be a valid email").optional(),

  // Observability (Optional in Dev, Recommended in Prod)
  SENTRY_DSN: z.string().url().optional(),

  // OpenTelemetry
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().default("http://localhost:4318"),
  OTEL_SERVICE_NAME: z.string().optional().default("run-remix"),

  // Caching (Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // biome-ignore lint/suspicious/noConsole: Critical startup error
    console.error("Invalid environment variables:", JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}
