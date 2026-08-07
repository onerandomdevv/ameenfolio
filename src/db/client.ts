import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { requireServerEnv } from "@/lib/env";

let database: NeonHttpDatabase<typeof schema> | undefined;

export function getDb() {
  if (!database) {
    const { DATABASE_URL } = requireServerEnv("DATABASE_URL");
    database = drizzle(neon(DATABASE_URL), { schema });
  }
  return database;
}
