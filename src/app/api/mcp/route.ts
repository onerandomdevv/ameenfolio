import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBippyMcpServer } from "@/lib/mcp/tools";
import {
  getMcpConfig,
  isMcpEnabled,
  mcpDisabledResponse,
} from "@/lib/mcp/config";
import { verifyMcpAccessToken } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function challenge() {
  const config = getMcpConfig();
  const metadata = new URL(
    "/.well-known/oauth-protected-resource",
    config.resource,
  );
  return Response.json(
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${metadata}", scope="portfolio:read"`,
      },
    },
  );
}

async function handle(request: Request) {
  if (!isMcpEnabled()) return mcpDisabledResponse();
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return challenge();
  const actor = await verifyMcpAccessToken(match[1]);
  if (!actor) return challenge();

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createBippyMcpServer({
    client: actor.client,
    scopes: actor.token.scopes,
  });
  await server.connect(transport);
  return transport.handleRequest(request, {
    authInfo: {
      token: actor.rawToken,
      clientId: actor.client.clientId,
      scopes: actor.token.scopes,
      expiresAt: Math.floor(actor.token.accessExpiresAt.getTime() / 1000),
      resource: new URL(actor.token.resource),
      extra: { userId: actor.token.userId },
    },
  });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
  });
}
