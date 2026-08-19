import { isMcpEnabled, mcpDisabledResponse } from "@/lib/mcp/config";
import { revokeMcpToken } from "@/lib/mcp/oauth";
import { logServer } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isMcpEnabled()) return mcpDisabledResponse();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "invalid_request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = String(form.get("token") ?? "");
  const clientId = String(form.get("client_id") ?? "") || undefined;
  if (!token) {
    return Response.json(
      { error: "invalid_request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await revokeMcpToken(token, clientId);
    if (result === "client_mismatch") {
      return Response.json(
        { error: "invalid_client" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch (error) {
    logServer("error", "mcp.revoke_failed", { error: String(error) });
    return Response.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}
