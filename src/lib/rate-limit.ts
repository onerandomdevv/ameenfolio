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
 * Headers the edge sets on the request itself, overwriting or ignoring any
 * copy the client sent. A caller cannot choose these values, so they are the
 * only ones worth trusting to tell one visitor from another.
 *
 * Naming several platforms is not platform-specific configuration: whichever
 * host is in front supplies its own, the rest are simply absent, and a
 * deployment behind none of them still works via the fallback below.
 */
const verifiedClientIpHeaders = [
  "cf-connecting-ip", // Cloudflare
  "x-vercel-forwarded-for", // Vercel
  "fly-client-ip", // Fly.io
  "true-client-ip", // Akamai, Cloudflare Enterprise
] as const;

/**
 * Best-effort client identity, preferring headers a client cannot forge.
 *
 * The subtlety worth stating: `x-forwarded-for` is *appended* to by each hop,
 * so its left-most entry is whatever the original caller put there — including
 * behind a reverse proxy. Reading it first would let one client mint a new
 * identity per request simply by varying a header, which defeats the limiter
 * that calls this.
 *
 * Taking the right-most entry instead would be forgery-resistant but wrong in
 * a different direction: with more than one hop it yields a proxy's address,
 * collapsing many real visitors into a single bucket and rate-limiting people
 * who did nothing. Given what this protects — an upstream quota, not data —
 * wrongly refusing real visitors is the worse failure, so the fallback stays
 * left-most and best-effort.
 *
 * This remains unsuitable as an identity or authorization control.
 */
export function clientKeyFromHeaders(headers: Headers) {
  for (const header of verifiedClientIpHeaders) {
    const verified = headers.get(header)?.trim();
    // Some edges pass a list here too; the left-most is the client, and every
    // entry originated at the edge rather than the caller.
    if (verified) {
      const first = verified.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
