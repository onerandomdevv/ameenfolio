import { describe, expect, it } from "vitest";
import { shouldBypassAdminSessionMiddleware } from "./admin-auth-path";

function params(value = "") {
  return new URLSearchParams(value);
}

describe("admin authentication path routing", () => {
  it("keeps login and the initial MCP authorization request public", () => {
    expect(shouldBypassAdminSessionMiddleware("/admin/login", params())).toBe(
      true,
    );
    expect(
      shouldBypassAdminSessionMiddleware(
        "/admin/mcp/authorize",
        params("client_id=chatgpt&state=oauth-state"),
      ),
    ).toBe(true);
  });

  it("sends the GitHub OAuth return through Neon session exchange", () => {
    expect(
      shouldBypassAdminSessionMiddleware(
        "/admin/mcp/authorize",
        params(
          "client_id=chatgpt&neon_auth_session_verifier=one-time-verifier",
        ),
      ),
    ).toBe(false);
  });

  it("continues protecting other admin routes", () => {
    expect(
      shouldBypassAdminSessionMiddleware("/admin/assistant", params()),
    ).toBe(false);
    expect(shouldBypassAdminSessionMiddleware("/admin/mcp", params())).toBe(
      false,
    );
  });
});
