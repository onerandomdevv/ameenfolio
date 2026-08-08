import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  // Server Actions POST to the page URL, so they match this matcher. Redirecting
  // one produces a 307, which preserves the method: React re-POSTs the action
  // payload to the login page, receives HTML instead of an action result, and
  // the call resolves to nothing — the mutation fails with nothing surfaced to
  // the user. Let them through; every action in src/app/admin/actions calls
  // requireAdmin() itself, which redirects visibly when the session is gone.
  // Method is checked too: Server Actions are always POST, so a spoofed header
  // on any other method has no reason to skip the session check.
  if (request.method === "POST" && request.headers.get("next-action")) {
    return NextResponse.next();
  }
  return getAuth().middleware({ loginUrl: "/admin/login" })(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
