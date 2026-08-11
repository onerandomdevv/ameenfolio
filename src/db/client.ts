import "server-only";

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { createRetryingFetch } from "@/db/retry";
import { requireServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";

let database: NeonHttpDatabase<typeof schema> | undefined;

export function getDb() {
  if (!database) {
    const { DATABASE_URL } = requireServerEnv("DATABASE_URL");
    // Retry lives at the driver so every caller inherits it — the public pages,
    // the admin, and the stats refresh alike — rather than each query site
    // remembering to ask for it. The driver only exposes this globally, not
    // per connection, so it is set once alongside the memoised instance.
    neonConfig.fetchFunction = createRetryingFetch(fetch, {
      onRetry: (attempt, error) =>
        logServer("warn", "db.fetch_retry", {
          attempt,
          error: String(error),
        }),
    });
    database = drizzle(neon(DATABASE_URL), { schema });
  }
  return database;
}
