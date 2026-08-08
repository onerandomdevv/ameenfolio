import "server-only";

import { headers } from "next/headers";

export const ADMIN_HOST_PREFIX = "admin.";

/**
 * Where the admin app is mounted for the current request.
 *
 * On an `admin.` host it owns the root, so its links carry no prefix. Anywhere
 * else — the public domain, or a platform fallback URL where no `admin.`
 * sibling can exist — it is reachable under `/admin`. Resolving this per
 * request is what keeps the fallback usable: hardcoding either form would make
 * the admin unnavigable on the other host.
 */
export async function adminBasePath() {
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  return host.startsWith(ADMIN_HOST_PREFIX) ? "" : "/admin";
}

export async function adminHref(path: string) {
  return `${await adminBasePath()}${path}`;
}
