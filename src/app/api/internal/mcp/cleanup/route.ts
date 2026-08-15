import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { cleanupExpiredMcpCredentials } from "@/lib/mcp/connections";
import { cleanupExpiredArticleImagesForMcp } from "@/lib/mcp/article-image-cleanup.server";

export const runtime = "nodejs";

function authorized(request: Request, expected: string) {
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!supplied) return false;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const secret = getServerEnv().MCP_MAINTENANCE_SECRET;
  if (!secret) return Response.json({ error: "not_found" }, { status: 404 });
  if (!authorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const [credentials, articleImages] = await Promise.all([
      cleanupExpiredMcpCredentials(),
      cleanupExpiredArticleImagesForMcp(),
    ]);
    logServer("info", "mcp.cleanup_completed", {
      ...credentials,
      articleImages,
    });
    return Response.json({ removed: { ...credentials, articleImages } });
  } catch (error) {
    logServer("error", "mcp.cleanup_failed", { error: String(error) });
    return Response.json({ error: "cleanup_failed" }, { status: 500 });
  }
}
