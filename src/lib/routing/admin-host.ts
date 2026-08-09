// Paths that must reach their real route on the admin host untouched. The
// trailing slash on `/bippy/` is intentional: `/bippy` is the protected admin
// playground, while its files in `public/bippy` are shared static assets.
export function isAdminHostSharedPath(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/media/") ||
    pathname.startsWith("/bippy/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}
