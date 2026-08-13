import "server-only";

import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  notExists,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agentApprovals,
  agentToolCalls,
  mcpOAuthClients,
  mcpOAuthCodes,
  mcpOAuthTokens,
} from "@/db/schema";

export type McpExternalActivitySummary = {
  id: string;
  toolName: string;
  status: "running" | "completed" | "failed";
  approvalStatus:
    | "pending"
    | "approved"
    | "rejected"
    | "executed"
    | "failed"
    | null;
  createdAt: string;
};

export type McpConnectionSummary = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
  active: boolean;
  status: "connected" | "inactive" | "pending";
  recentActivity: McpExternalActivitySummary[];
};

export async function listMcpConnections(): Promise<McpConnectionSummary[]> {
  const db = getDb();
  const [clients, tokens] = await Promise.all([
    db.select().from(mcpOAuthClients),
    db.select().from(mcpOAuthTokens),
  ]);
  const threadIds = clients.flatMap((client) =>
    client.threadId ? [client.threadId] : [],
  );
  const activity = threadIds.length
    ? await db
        .select({
          id: agentToolCalls.id,
          threadId: agentToolCalls.threadId,
          toolName: agentToolCalls.toolName,
          status: agentToolCalls.status,
          approvalStatus: agentApprovals.status,
          createdAt: agentToolCalls.createdAt,
        })
        .from(agentToolCalls)
        .leftJoin(
          agentApprovals,
          eq(agentApprovals.toolCallId, agentToolCalls.id),
        )
        .where(inArray(agentToolCalls.threadId, threadIds))
        .orderBy(desc(agentToolCalls.createdAt))
        .limit(200)
    : [];
  const now = Date.now();

  return clients
    .map((client) => {
      const clientTokens = tokens.filter(
        (token) => token.clientId === client.clientId,
      );
      const activeTokens = clientTokens.filter(
        (token) => !token.revokedAt && token.refreshExpiresAt.getTime() > now,
      );
      const status: McpConnectionSummary["status"] = activeTokens.length
        ? "connected"
        : clientTokens.length
          ? "inactive"
          : "pending";
      return {
        clientId: client.clientId,
        clientName: client.clientName,
        redirectUris: client.redirectUris,
        scopes: [
          ...new Set(clientTokens.flatMap((token) => token.scopes)),
        ].sort(),
        connectedAt: client.createdAt.toISOString(),
        lastUsedAt: client.lastUsedAt?.toISOString() ?? null,
        active: activeTokens.length > 0,
        status,
        recentActivity: client.threadId
          ? activity
              .filter((item) => item.threadId === client.threadId)
              .slice(0, 10)
              .map((item) => ({
                id: item.id,
                toolName: item.toolName,
                status: item.status as McpExternalActivitySummary["status"],
                approvalStatus:
                  item.approvalStatus as McpExternalActivitySummary["approvalStatus"],
                createdAt: item.createdAt.toISOString(),
              }))
          : [],
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastUsedAt ?? b.connectedAt).getTime() -
        new Date(a.lastUsedAt ?? a.connectedAt).getTime(),
    );
}

export async function disconnectMcpClient(clientId: string) {
  const now = new Date();
  const db = getDb();
  const [revoked] = await db
    .update(mcpOAuthTokens)
    .set({ revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(mcpOAuthTokens.clientId, clientId),
        isNull(mcpOAuthTokens.revokedAt),
      ),
    )
    .returning({ id: mcpOAuthTokens.id });
  await db.delete(mcpOAuthCodes).where(eq(mcpOAuthCodes.clientId, clientId));
  return Boolean(revoked);
}

export async function touchMcpClient(clientId: string) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000);
  await getDb()
    .update(mcpOAuthClients)
    .set({ lastUsedAt: now })
    .where(
      and(
        eq(mcpOAuthClients.clientId, clientId),
        or(
          isNull(mcpOAuthClients.lastUsedAt),
          lt(mcpOAuthClients.lastUsedAt, staleBefore),
        ),
      ),
    );
}

export type McpCleanupResult = {
  authorizationCodes: number;
  tokens: number;
  clients: number;
};

export async function cleanupExpiredMcpCredentials(
  now = new Date(),
): Promise<McpCleanupResult> {
  const db = getDb();
  const revokedCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const clientCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const deletedCodes = await db
    .delete(mcpOAuthCodes)
    .where(
      or(
        lt(mcpOAuthCodes.expiresAt, now),
        and(isNotNull(mcpOAuthCodes.usedAt), lt(mcpOAuthCodes.createdAt, now)),
      ),
    )
    .returning({ id: mcpOAuthCodes.id });

  const deletedTokens = await db
    .delete(mcpOAuthTokens)
    .where(
      or(
        lt(mcpOAuthTokens.refreshExpiresAt, now),
        and(
          isNotNull(mcpOAuthTokens.revokedAt),
          lt(mcpOAuthTokens.revokedAt, revokedCutoff),
        ),
      ),
    )
    .returning({ id: mcpOAuthTokens.id });

  const deletedClients = await db
    .delete(mcpOAuthClients)
    .where(
      and(
        lt(mcpOAuthClients.createdAt, clientCutoff),
        notExists(
          db
            .select({ id: mcpOAuthTokens.id })
            .from(mcpOAuthTokens)
            .where(
              and(
                eq(mcpOAuthTokens.clientId, mcpOAuthClients.clientId),
                isNull(mcpOAuthTokens.revokedAt),
                gt(mcpOAuthTokens.refreshExpiresAt, now),
              ),
            ),
        ),
        notExists(
          db
            .select({ id: mcpOAuthCodes.id })
            .from(mcpOAuthCodes)
            .where(
              and(
                eq(mcpOAuthCodes.clientId, mcpOAuthClients.clientId),
                isNull(mcpOAuthCodes.usedAt),
                gt(mcpOAuthCodes.expiresAt, now),
              ),
            ),
        ),
      ),
    )
    .returning({ id: mcpOAuthClients.clientId });

  return {
    authorizationCodes: deletedCodes.length,
    tokens: deletedTokens.length,
    clients: deletedClients.length,
  };
}
