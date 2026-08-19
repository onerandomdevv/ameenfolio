import { isMcpEnabled, mcpDisabledResponse } from "@/lib/mcp/config";
import { OAuthError, registerMcpClient } from "@/lib/mcp/oauth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isMcpEnabled()) return mcpDisabledResponse();
  try {
    return Response.json(await registerMcpClient(await request.json()), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const known = error instanceof OAuthError ? error : null;
    return Response.json(
      {
        error: known?.code ?? "server_error",
        error_description: known?.message ?? "Client registration failed.",
      },
      {
        status: known?.status ?? 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
