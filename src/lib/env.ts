import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  ADMIN_GITHUB_USER_ID: z.string().regex(/^\d+$/).default("231661599"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal("")),
  // Optional, and an empty value is as valid as an absent one. A declared but
  // blank key is the normal state of a fresh .env — and since every page calls
  // getServerEnv(), rejecting "" here would take the whole site down over a
  // credential the stats strip is happy to do without.
  GITHUB_STATS_USERNAME: z.string().trim().optional(),
  GITHUB_STATS_TOKEN: z.string().trim().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  CANONICAL_SITE_URL: z.string().url().default("http://localhost:3000"),
});

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
