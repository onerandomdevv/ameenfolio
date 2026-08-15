/**
 * A fixed-window rate limiter held in memory.
 *
 * Deliberately small: no Redis, no platform primitive, nothing to provision —
 * this repo stays host-agnostic, and the thing being protected is a personal
 * portfolio's proxy to a third-party API, not a payments endpoint.
 *
 * The consequence of living in memory is that each server instance counts
 * separately, so a deployment running N instances allows up to N times the
 * limit overall. That is fine for the purpose: the goal is to stop one client
 * cycling requests fast enough to burn an upstream quota, not to enforce an
 * exact global budget.
 */

type Window = { count: number; resetAt: number };

// Bounds the map so the limiter cannot become its own memory leak. Sweeping
// expired windows normally reclaims enough; the eviction below is the
// backstop for the case where it does not.
const MAX_TRACKED_KEYS = 500;

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets. Zero when allowed. */
  retryAfterSeconds: number;
};

export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const windows = new Map<string, Window>();

  return function check(key: string, now = Date.now()): RateLimitResult {
    const existing = windows.get(key);

    if (!existing || existing.resetAt <= now) {
      if (windows.size >= MAX_TRACKED_KEYS) {
        for (const [trackedKey, window] of windows) {
          if (window.resetAt <= now) windows.delete(trackedKey);
        }
        // Map iterates in insertion order, so the first key is the oldest.
        if (windows.size >= MAX_TRACKED_KEYS) {
          const oldest = windows.keys().next().value;
          if (oldest !== undefined) windows.delete(oldest);
        }
      }
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt - now) / 1_000),
        ),
      };
    }

    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

/**
 * Best-effort client identity from proxy headers.
 *
 * These headers are trivially spoofable when a request reaches the app
 * directly, so this is not an identity control and must not be used as one.
 * Behind the reverse proxy every real deployment of this site sits behind, it
 * is good enough to tell one visitor from another — which is all the limiter
 * needs.
 */
export function clientKeyFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  // The left-most entry is the original client; the rest are proxy hops.
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
