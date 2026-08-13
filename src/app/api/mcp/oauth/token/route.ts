import { isMcpEnabled, mcpDisabledResponse } from "@/lib/mcp/config";
import {
  exchangeAuthorizationCode,
  OAuthError,
  refreshMcpToken,
} from "@/lib/mcp/oauth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isMcpEnabled()) return mcpDisabledResponse();
  try {
    const form = await request.formData();
    const grantType = String(form.get("grant_type") ?? "");
    const clientId = String(form.get("client_id") ?? "");
    const resource = String(form.get("resource") ?? "");
    const tokens =
      grantType === "authorization_code"
        ? await exchangeAuthorizationCode({
            code: String(form.get("code") ?? ""),
            clientId,
            redirectUri: String(form.get("redirect_uri") ?? ""),
            codeVerifier: String(form.get("code_verifier") ?? ""),
            resource,
          })
        : grantType === "refresh_token"
          ? await refreshMcpToken({
              refreshToken: String(form.get("refresh_token") ?? ""),
              clientId,
              resource,
            })
          : (() => {
              throw new OAuthError(
                "unsupported_grant_type",
                "Only authorization_code and refresh_token are supported.",
              );
            })();
    return Response.json(tokens, {
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  } catch (error) {
    const known = error instanceof OAuthError ? error : null;
    return Response.json(
      {
        error: known?.code ?? "server_error",
        error_description: known?.message ?? "Token exchange failed.",
      },
      {
        status: known?.status ?? 500,
        headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
      },
    );
  }
}
