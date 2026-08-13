import { isMcpEnabled, mcpDisabledResponse } from "@/lib/mcp/config";
import { revokeMcpToken } from "@/lib/mcp/oauth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isMcpEnabled()) return mcpDisabledResponse();

  try {
    const form = await request.formData();
    const token = String(form.get("token") ?? "");
    const clientId = String(form.get("client_id") ?? "") || undefined;
    if (token) await revokeMcpToken(token, clientId);
  } catch {
    // RFC 7009 intentionally does not disclose whether a token existed.
  }

  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}
