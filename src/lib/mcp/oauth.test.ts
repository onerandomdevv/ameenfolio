import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  authorizationRequestSchema,
  clientRegistrationSchema,
  OAuthError,
  parseMcpScopes,
  verifyMcpPkce,
} from "@/lib/mcp/oauth-validation";

describe("Bippy MCP OAuth validation", () => {
  it("accepts a public PKCE client and rejects insecure remote callbacks", () => {
    expect(
      clientRegistrationSchema.parse({
        client_name: "ChatGPT",
        redirect_uris: ["https://chatgpt.com/connector/callback"],
      }).token_endpoint_auth_method,
    ).toBe("none");
    expect(() =>
      clientRegistrationSchema.parse({
        client_name: "Remote client",
        redirect_uris: ["http://example.com/callback"],
      }),
    ).toThrow();
  });

  it("requires authorization code, S256 PKCE, state, and an explicit resource", () => {
    expect(() =>
      authorizationRequestSchema.parse({
        response_type: "code",
        client_id: "client",
        redirect_uri: "https://chatgpt.com/connector/callback",
        code_challenge: "x".repeat(43),
        code_challenge_method: "plain",
        state: "state",
        resource: "https://portfolio.example/api/mcp",
      }),
    ).toThrow();
  });

  it("allows only the three bounded portfolio scopes", () => {
    expect(parseMcpScopes("portfolio:read portfolio:draft")).toEqual([
      "portfolio:read",
      "portfolio:draft",
    ]);
    expect(() => parseMcpScopes("database:write")).toThrow(OAuthError);
  });

  it("verifies S256 proof keys without storing the verifier", () => {
    const verifier = "a".repeat(64);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    expect(verifyMcpPkce(verifier, challenge)).toBe(true);
    expect(verifyMcpPkce("b".repeat(64), challenge)).toBe(false);
  });
});
