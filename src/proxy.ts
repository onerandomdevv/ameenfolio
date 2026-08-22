import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { shouldBypassAdminSessionMiddleware } from "@/lib/routing/admin-auth-path";
import {
  adminRobotsText,
  isAdminHostSharedPath,
  restoreAdminHostRedirect,
} from "@/lib/routing/admin-host";

// Matched on the subdomain label rather than a full domain so the project stays
// host-neutral: any host beginning with `admin.` serves the admin app at its
// root, whatever domain it is deployed under.
const ADMIN_HOST_PREFIX = "admin.";

function onAdminHost(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  return host.startsWith(ADMIN_HOST_PREFIX);
}

// Server Actions POST to the page URL, so they match this proxy. Redirecting one
// produces a 307, which preserves the method: React re-POSTs the action payload
// to the login page, receives HTML instead of an action result, and the call
// resolves to nothing — the mutation fails with nothing surfaced to the user.
// Every action in src/app/admin/actions calls requireAdmin() itself, which
// redirects visibly when the session is gone. The method is checked too, since
// Server Actions are always POST and a spoofed header on any other method has no
// reason to skip the session check.
function isServerAction(request: NextRequest) {
  return (
    request.method === "POST" && Boolean(request.headers.get("next-action"))
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!onAdminHost(request)) {
    // Path-mounted fallback. The admin host is the intended way in, but a
    // platform URL cannot have an `admin.` sibling, so refusing this would make
    // the admin unreachable exactly when DNS is the thing that is broken.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      if (
        shouldBypassAdminSessionMiddleware(
          pathname,
          request.nextUrl.searchParams,
        ) ||
        isServerAction(request)
      ) {
        return NextResponse.next();
      }
      return getAuth().middleware({ loginUrl: "/admin/login" })(request);
    }
    return NextResponse.next();
  }

  if (pathname === "/robots.txt") {
    return new NextResponse(adminRobotsText, {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (pathname === "/sitemap.xml" || pathname === "/llms.txt") {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (isAdminHostSharedPath(pathname)) return NextResponse.next();

  // On the admin host the /admin prefix is an implementation detail of the route
  // tree, not a URL. Rejecting it keeps one page reachable at one address.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }

  const target = pathname === "/" ? "/admin/assistant" : `/admin${pathname}`;
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = target;

  if (
    shouldBypassAdminSessionMiddleware(target, request.nextUrl.searchParams) ||
    isServerAction(request)
  ) {
    return NextResponse.rewrite(rewriteUrl);
  }

  // The session check has to see the rewritten path, or it would be deciding
  // whether to protect `/settings` rather than `/admin/settings`. loginUrl is
  // the browser-facing path on this host, which is `/login`, not `/admin/login`.
  const authResponse = await getAuth().middleware({ loginUrl: "/login" })(
    new NextRequest(rewriteUrl, request),
  );

  if (authResponse.status >= 300 && authResponse.status < 400) {
    // The redirect is built from the URL handed to the middleware, whose host
    // can differ from the one the browser asked for. Sending the visitor to the
    // public host's /login would land them on a 404 instead of the sign-in page.
    const location = authResponse.headers.get("location");
    const requestHost = request.headers.get("host");
    if (location && requestHost) {
      const redirectUrl = restoreAdminHostRedirect(
        location,
        request.url,
        requestHost,
      );
      authResponse.headers.set("location", redirectUrl.toString());
    }
    return authResponse;
  }

  // The middleware refreshes the session cookie on the response it returns, so
  // those headers have to be carried onto the rewrite that actually gets sent.
  const rewrite = NextResponse.rewrite(rewriteUrl);
  for (const cookie of authResponse.headers.getSetCookie()) {
    rewrite.headers.append("set-cookie", cookie);
  }
  return rewrite;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
