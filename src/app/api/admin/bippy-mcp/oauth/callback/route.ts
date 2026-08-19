import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { finishBippyMcpOAuth } from "@/lib/ai/bippy-mcp";
import { ADMIN_HOST_PREFIX } from "@/lib/admin-path";
import { logServer } from "@/lib/logger";

export const runtime = "nodejs";

function connectionsUrl(request: Request, status: "connected" | "error") {
  const url = new URL(request.url);
  const host = url.host.toLowerCase();
  url.pathname = host.startsWith(ADMIN_HOST_PREFIX)
    ? "/assistant/connections"
    : "/admin/assistant/connections";
  url.search = new URLSearchParams({ oauth: status }).toString();
  return url;
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  if (!state || !code || oauthError) {
    logServer("warn", "assistant.mcp_oauth_callback_rejected", {
      reason: oauthError ?? "missing_code_or_state",
    });
    return NextResponse.redirect(connectionsUrl(request, "error"));
  }

  try {
    await finishBippyMcpOAuth(state, code);
    return NextResponse.redirect(connectionsUrl(request, "connected"));
  } catch (error) {
    logServer("error", "assistant.mcp_oauth_callback_failed", {
      error: String(error),
    });
    return NextResponse.redirect(connectionsUrl(request, "error"));
  }
}
