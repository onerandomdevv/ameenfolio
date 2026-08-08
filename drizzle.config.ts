import { defineConfig } from "drizzle-kit";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    throw error;
  }
}

const url =
  process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!url) {
  throw new Error(
    "DATABASE_MIGRATION_URL or DATABASE_URL_UNPOOLED is required for Drizzle commands.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
