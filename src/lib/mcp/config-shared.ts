export const MCP_SCOPES = [
  "portfolio:read",
  "portfolio:draft",
  "portfolio:propose",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];
