import "dotenv/config";
import { z } from "zod";

const optionalUrl = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().url().optional()
);

const optionalNonEmptyString = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().optional()
);

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  FRONTEND_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    ),
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
  DATABASE_URL: optionalNonEmptyString,
  LLM_PROVIDER: z.enum(["disabled", "openai", "gemini", "anthropic"]).default("disabled"),
  LLM_API_KEY: optionalNonEmptyString,
  SARVAM_API_KEY: optionalNonEmptyString,
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fieldNames = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid backend environment configuration for fields: ${fieldNames}`);
  }
  return parsed.data;
}

export const env: AppEnv = loadEnv();
