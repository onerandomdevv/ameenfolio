const NEON_AUTH_SESSION_VERIFIER = "neon_auth_session_verifier";

/**
 * Login and the first MCP consent request must render without an existing
 * session. The OAuth return is different: Neon adds a one-time verifier that
 * its middleware must exchange for the session cookie before the page runs.
 */
export function shouldBypassAdminSessionMiddleware(
  pathname: string,
  searchParams: URLSearchParams,
) {
  if (pathname === "/admin/login") return true;
  if (pathname !== "/admin/mcp/authorize") return false;
  return !searchParams.has(NEON_AUTH_SESSION_VERIFIER);
}
