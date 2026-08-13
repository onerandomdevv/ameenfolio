import "server-only";

import { getServerEnv, requireServerEnv } from "@/lib/env";
import { MCP_SCOPES } from "@/lib/mcp/config-shared";

export function isMcpEnabled() {
  return getServerEnv().MCP_ENABLED;
}

export function getMcpConfig() {
  const env = getServerEnv();
  if (!env.MCP_ENABLED) throw new Error("Bippy MCP is disabled.");
  const required = requireServerEnv(
    "MCP_RESOURCE_URL",
    "MCP_AUTH_ISSUER",
    "MCP_AUTHORIZATION_URL",
  );
  return {
    resource: new URL(required.MCP_RESOURCE_URL).toString(),
    issuer: new URL(required.MCP_AUTH_ISSUER).origin,
    authorizationUrl: new URL(required.MCP_AUTHORIZATION_URL).toString(),
    scopes: [...MCP_SCOPES],
  };
}

export function mcpDisabledResponse() {
  return Response.json({ error: "not_found" }, { status: 404 });
}
