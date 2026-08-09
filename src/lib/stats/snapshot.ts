import "server-only";

import { getDb } from "@/db/client";
import { statsSnapshot, type StatsSnapshot } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { fetchGithubStats, type GithubStats } from "@/lib/stats/github";

// Long enough that a busy day costs a handful of GitHub calls, short enough
// that a streak is never more than a quarter-day out of date.
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export function isSnapshotStale(
  snapshot: Pick<StatsSnapshot, "fetchedAt"> | null,
  now = Date.now(),
) {
  if (!snapshot) return true;
  return now - snapshot.fetchedAt.getTime() > STALE_AFTER_MS;
}

export function canFetchGithubStats() {
  const env = getServerEnv();
  return Boolean(env.GITHUB_STATS_USERNAME && env.GITHUB_STATS_TOKEN);
}

// The snapshot stays stale until a refresh commits, so every request arriving
// in that gap would otherwise start its own GitHub fetch. Sharing one promise
// collapses a burst into a single call. Per instance only — it does not
// coordinate across servers, which for a personal site is not worth a lock.
let inFlight: Promise<GithubStats | null> | null = null;

// Refresh failures are logged and swallowed: the strip is decoration on a
// personal site, and an unreachable GitHub must never take the homepage with
// it. Readers keep serving the previous snapshot until a later attempt lands.
export async function refreshStatsSnapshot() {
  const env = getServerEnv();
  if (!env.DATABASE_URL || !canFetchGithubStats()) return null;

  inFlight ??= runRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runRefresh(): Promise<GithubStats | null> {
  const env = getServerEnv();

  try {
    const stats = await fetchGithubStats(
      env.GITHUB_STATS_USERNAME!,
      env.GITHUB_STATS_TOKEN!,
    );
    const values = { ...stats, fetchedAt: new Date() };

    await getDb()
      .insert(statsSnapshot)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: statsSnapshot.id, set: values });

    logServer("info", "stats.snapshot_refreshed", {
      contributions: stats.contributions,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    });
    return stats;
  } catch (error) {
    logServer("error", "stats.snapshot_refresh_failed", {
      error: String(error),
    });
    return null;
  }
}
