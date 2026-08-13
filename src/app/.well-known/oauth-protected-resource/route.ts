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
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: config.scopes,
  });
}
