// Paths that must reach their real route on the admin host untouched. The
// trailing slash on `/bippy/` is intentional: `/bippy` is the protected admin
// playground, while its files in `public/bippy` are shared static assets.
// Next.js preserves the admin route segment in its generated icon URL, so that
// single metadata asset must also bypass the subdomain's `/admin` rejection.
export function isAdminHostSharedPath(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/media/") ||
    pathname.startsWith("/bippy/") ||
    pathname === "/admin/icon.png" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}
