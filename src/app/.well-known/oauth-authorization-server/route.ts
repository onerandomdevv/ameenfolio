import {
  getMcpConfig,
  isMcpEnabled,
  mcpDisabledResponse,
} from "@/lib/mcp/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMcpEnabled()) return mcpDisabledResponse();
  const config = getMcpConfig();
  return Response.json({
    issuer: config.issuer,
    authorization_endpoint: config.authorizationUrl,
    token_endpoint: new URL("/api/mcp/oauth/token", config.issuer).toString(),
    revocation_endpoint: new URL(
      "/api/mcp/oauth/revoke",
      config.issuer,
    ).toString(),
    registration_endpoint: new URL(
      "/api/mcp/oauth/register",
      config.issuer,
    ).toString(),
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: config.scopes,
  });
}
