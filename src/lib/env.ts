import { z } from "zod";

const serverEnvShape = z.object({
  DATABASE_URL: z.string().url().optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  ADMIN_GITHUB_USER_ID: z.string().regex(/^\d+$/).default("231661599"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  GITHUB_STATS_USERNAME: z.string().trim().optional(),
  GITHUB_STATS_TOKEN: z.string().trim().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  CANONICAL_SITE_URL: z.string().url().default("http://localhost:3000"),
});

// A declared-but-blank variable means "not configured", not "configured with
// an invalid value". Shells, CI workflows and .env files all express an unset
// optional as `KEY=`, and validating "" against .url() or .min(32) turns that
// into a parse error. getServerEnv() throws on a failed parse and is reached
// from page render, so one blank optional key takes the whole site down.
//
// Dropping empty values here lets .optional() and .default() mean what they
// say, and leaves requireServerEnv() as the single place that decides a
// variable is genuinely mandatory — at the point of use rather than at boot.
export const serverEnvSchema = z.preprocess(
  (raw) =>
    Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).filter(
        ([, value]) => value !== "",
      ),
    ),
  serverEnvShape,
);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = serverEnvSchema.parse(process.env);
  }
  return cached;
}

export function requireServerEnv<
  K extends keyof Pick<
    ServerEnv,
    | "DATABASE_URL"
    | "NEON_AUTH_BASE_URL"
    | "NEON_AUTH_COOKIE_SECRET"
    | "R2_ACCOUNT_ID"
    | "R2_ACCESS_KEY_ID"
    | "R2_SECRET_ACCESS_KEY"
    | "R2_BUCKET_NAME"
  >,
>(...keys: K[]): ServerEnv & Record<K, string> {
  const env = getServerEnv();
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required server environment: ${missing.join(", ")}`,
    );
  }
  return env as ServerEnv & Record<K, string>;
}
