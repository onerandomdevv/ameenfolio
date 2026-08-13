import { createHash } from "node:crypto";
import { z } from "zod";
import { MCP_SCOPES, type McpScope } from "@/lib/mcp/config-shared";

export class OAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

const redirectUri = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    );
  }, "Redirect URIs must use HTTPS, except for loopback development clients.");

export const clientRegistrationSchema = z.object({
  client_name: z.string().trim().min(1).max(120),
  redirect_uris: z.array(redirectUri).min(1).max(10),
  token_endpoint_auth_method: z.literal("none").default("none"),
  grant_types: z
    .array(z.enum(["authorization_code", "refresh_token"]))
    .default(["authorization_code", "refresh_token"]),
  response_types: z.array(z.literal("code")).default(["code"]),
});

export const authorizationRequestSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: redirectUri,
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  code_challenge_method: z.literal("S256"),
  state: z.string().min(1).max(2048),
  resource: z.string().url(),
  scope: z.string().default("portfolio:read"),
});

export function parseMcpScopes(value: string): McpScope[] {
  const requested = [...new Set(value.split(/\s+/).filter(Boolean))];
  if (!requested.length) return ["portfolio:read"];
  if (requested.some((scope) => !MCP_SCOPES.includes(scope as McpScope))) {
    throw new OAuthError(
      "invalid_scope",
      "One or more requested scopes are unsupported.",
    );
  }
  return requested as McpScope[];
}

export function verifyMcpPkce(verifier: string, challenge: string) {
  return (
    createHash("sha256").update(verifier).digest("base64url") === challenge
  );
}
