import type { Metadata } from "next";
import { BippyMcpConnectionsWorkspace } from "@/components/admin/bippy-mcp-connections-workspace";
import { listBippyMcpConnections } from "@/lib/ai/bippy-mcp";
import { listAssistantThreads } from "@/lib/ai/repository";

export const metadata: Metadata = {
  title: "Bippy Connections",
  description: "Control the external MCP tools available to Bippy.",
  robots: { index: false, follow: false },
};

export default async function BippyConnectionsPage() {
  const [threads, connections] = await Promise.all([
    listAssistantThreads(),
    listBippyMcpConnections(),
  ]);
  return (
    <BippyMcpConnectionsWorkspace
      threads={threads}
      initialConnections={connections}
    />
  );
}
