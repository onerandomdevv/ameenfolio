"use client";

import { usePathname } from "next/navigation";

/**
 * Client-side counterpart to `adminBasePath`.
 *
 * The proxy rewrites rather than redirects, so the browser keeps the address it
 * asked for: `/settings` on an `admin.` host, `/admin/settings` on the public
 * domain or a platform fallback URL. That visible path is enough to tell which
 * mounting is in effect without threading the host through the tree.
 */
export function useAdminBase() {
  const pathname = usePathname();
  return pathname === "/admin" || pathname.startsWith("/admin/")
    ? "/admin"
    : "";
}
