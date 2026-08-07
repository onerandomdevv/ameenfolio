import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  return getAuth().middleware({ loginUrl: "/admin/login" })(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
