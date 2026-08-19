import type { Metadata } from "next";
import { McpConnectionsWorkspace } from "@/components/admin/mcp-connections-workspace";
import { listMcpConnections } from "@/lib/mcp/connections";

export const metadata: Metadata = {
  title: "MCP",
  description: "Review and revoke private clients connected to the portfolio.",
  robots: { index: false, follow: false },
};

export default async function McpPage() {
  const connections = await listMcpConnections();
  return <McpConnectionsWorkspace connections={connections} />;
}
