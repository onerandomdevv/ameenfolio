import "server-only";

import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agentApprovals,
  agentCompactions,
  agentMessages,
  agentRuns,
  agentThreads,
  agentToolCalls,
  mcpOAuthClients,
} from "@/db/schema";
import type { ConversationState } from "@/lib/ai/provider";
import type {
  AssistantApprovalView,
  AssistantMessageView,
  AssistantThreadDetail,
  AssistantThreadSummary,
  AssistantToolCallView,
  McpPendingApproval,
} from "@/lib/ai/types";

function threadView(
  row: typeof agentThreads.$inferSelect,
): AssistantThreadSummary {
  return {
    id: row.id,
    title: row.title,
    provider: "openai",
    model: row.model,
    pinnedAt: row.pinnedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toolCallView(
  row: typeof agentToolCalls.$inferSelect,
): AssistantToolCallView {
  return {
    id: row.id,
    runId: row.runId,
    toolName: row.toolName,
    status: row.status as AssistantToolCallView["status"],
    requiresApproval: row.requiresApproval,
    createdAt: row.createdAt.toISOString(),
  };
}

function messageView(
  row: typeof agentMessages.$inferSelect,
): AssistantMessageView {
  return {
    id: row.id,
    runId: row.runId,
    role: row.role as AssistantMessageView["role"],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export function approvalView(
  row: typeof agentApprovals.$inferSelect,
): AssistantApprovalView {
  return {
    id: row.id,
    runId: row.runId,
    actionType: row.actionType,
    status: row.status as AssistantApprovalView["status"],
    preview: row.preview,
    resolutionNote: row.resolutionNote,
    requestedAt: row.requestedAt.toISOString(),
  };
}

export async function listAssistantThreads() {
  const db = getDb();
  const rows = await db
    .select()
    .from(agentThreads)
    .where(eq(agentThreads.kind, "chat"))
    .orderBy(
      sql`${agentThreads.pinnedAt} desc nulls last`,
      desc(agentThreads.updatedAt),
    )
    .limit(50);
  return rows.map(threadView);
}

export async function listMcpPendingApprovals(): Promise<McpPendingApproval[]> {
  const rows = await getDb()
    .select({
      approval: agentApprovals,
      clientId: mcpOAuthClients.clientId,
      clientName: mcpOAuthClients.clientName,
    })
    .from(agentApprovals)
    .innerJoin(
      mcpOAuthClients,
      eq(mcpOAuthClients.threadId, agentApprovals.threadId),
    )
    .where(eq(agentApprovals.status, "pending"))
    .orderBy(asc(agentApprovals.requestedAt));
  return rows.map((row) => ({
    ...approvalView(row.approval),
    clientId: row.clientId,
    clientName: row.clientName,
  }));
}

export async function getAssistantThread(
  id: string,
): Promise<AssistantThreadDetail | null> {
  const db = getDb();
  const [threadRows, messageRows, toolCallRows, approvalRows] =
    await Promise.all([
      db.select().from(agentThreads).where(eq(agentThreads.id, id)).limit(1),
      db
        .select()
        .from(agentMessages)
        .where(eq(agentMessages.threadId, id))
        .orderBy(asc(agentMessages.createdAt)),
      db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.threadId, id))
        .orderBy(asc(agentToolCalls.createdAt)),
      db
        .select()
        .from(agentApprovals)
        .where(eq(agentApprovals.threadId, id))
        .orderBy(asc(agentApprovals.requestedAt)),
    ]);
  if (!threadRows[0]) return null;
  return {
    thread: threadView(threadRows[0]),
    messages: messageRows.map(messageView),
    toolCalls: toolCallRows.map(toolCallView),
    approvals: approvalRows.map(approvalView),
  };
}

export async function createAssistantTurn(input: {
  threadId?: string;
  message: string;
  model: string;
}) {
  const db = getDb();
  const now = new Date();
  let thread: typeof agentThreads.$inferSelect;

  if (input.threadId) {
    const [existing] = await db
      .select()
      .from(agentThreads)
      .where(eq(agentThreads.id, input.threadId))
      .limit(1);
    if (!existing) throw new Error("Assistant thread not found.");
    thread = existing;
  } else {
    const [created] = await db
      .insert(agentThreads)
      .values({
        title: input.message.slice(0, 56),
        provider: "openai",
        model: input.model,
        updatedAt: now,
      })
      .returning();
    thread = created;
  }

  const [run] = await db
    .insert(agentRuns)
    .values({
      threadId: thread.id,
      provider: "openai",
      model: thread.model,
      status: "running",
    })
    .returning();
  const [message] = await db
    .insert(agentMessages)
    .values({
      threadId: thread.id,
      runId: run.id,
      role: "user",
      content: input.message,
    })
    .returning();
  await db
    .update(agentThreads)
    .set({ updatedAt: now })
    .where(eq(agentThreads.id, thread.id));

  return {
    thread: threadView({ ...thread, updatedAt: now }),
    run,
    message: messageView(message),
  };
}

export async function getConversationState(
  threadId: string,
): Promise<ConversationState> {
  const db = getDb();
  const [messages, checkpoints, tools, approvals] = await Promise.all([
    db
      .select({
        runId: agentMessages.runId,
        role: agentMessages.role,
        content: agentMessages.content,
      })
      .from(agentMessages)
      .where(eq(agentMessages.threadId, threadId))
      .orderBy(asc(agentMessages.createdAt)),
    db
      .select()
      .from(agentCompactions)
      .where(eq(agentCompactions.threadId, threadId))
      .limit(1),
    db
      .select({
        runId: agentToolCalls.runId,
        name: agentToolCalls.toolName,
        status: agentToolCalls.status,
      })
      .from(agentToolCalls)
      .where(eq(agentToolCalls.threadId, threadId))
      .orderBy(asc(agentToolCalls.createdAt)),
    db
      .select({
        runId: agentApprovals.runId,
        name: agentApprovals.actionType,
        status: agentApprovals.status,
        note: agentApprovals.resolutionNote,
      })
      .from(agentApprovals)
      .where(eq(agentApprovals.threadId, threadId))
      .orderBy(asc(agentApprovals.requestedAt)),
  ]);
  const checkpoint = checkpoints[0];

  return {
    messages: messages.map((message) => ({
      runId: message.runId,
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
    checkpoint: checkpoint
      ? {
          summary: checkpoint.summary,
          compactedMessageCount: checkpoint.compactedMessageCount,
        }
      : null,
    auditItems: [
      ...tools.map((item) => ({ ...item, kind: "tool" as const })),
      ...approvals.map((item) => ({ ...item, kind: "approval" as const })),
    ],
  };
}

export async function saveConversationCompaction(input: {
  threadId: string;
  summary: string;
  compactedMessageCount: number;
  sourceTokens: number;
  summaryTokens: number;
}) {
  const now = new Date();
  const [row] = await getDb()
    .insert(agentCompactions)
    .values({ ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: agentCompactions.threadId,
      set: {
        summary: input.summary,
        compactedMessageCount: input.compactedMessageCount,
        sourceTokens: input.sourceTokens,
        summaryTokens: input.summaryTokens,
        updatedAt: now,
      },
      setWhere: lt(
        agentCompactions.compactedMessageCount,
        input.compactedMessageCount,
      ),
    })
    .returning({ threadId: agentCompactions.threadId });
  return Boolean(row);
}

export async function completeAssistantRun(input: {
  threadId: string;
  runId: string;
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}) {
  const db = getDb();
  const now = new Date();
  const [message] = await db
    .insert(agentMessages)
    .values({
      threadId: input.threadId,
      runId: input.runId,
      role: "assistant",
      content: input.content,
    })
    .returning();
  await db.batch([
    db
      .update(agentRuns)
      .set({
        status: "completed",
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        finishedAt: now,
      })
      .where(eq(agentRuns.id, input.runId)),
    db
      .update(agentThreads)
      .set({ updatedAt: now })
      .where(eq(agentThreads.id, input.threadId)),
  ]);
  return messageView(message);
}

export async function failAssistantRun(runId: string, error: string) {
  await getDb()
    .update(agentRuns)
    .set({ status: "failed", error, finishedAt: new Date() })
    .where(eq(agentRuns.id, runId));
}

export async function recordToolCall(input: {
  threadId: string;
  runId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  execute: (call: typeof agentToolCalls.$inferSelect) => Promise<unknown>;
  requiresApproval?: boolean;
  onChange?: (call: AssistantToolCallView) => void;
}) {
  const db = getDb();
  const [call] = await db
    .insert(agentToolCalls)
    .values({
      threadId: input.threadId,
      runId: input.runId,
      toolName: input.toolName,
      arguments: input.arguments,
      status: "running",
      requiresApproval: input.requiresApproval ?? false,
    })
    .returning();
  input.onChange?.(toolCallView(call));
  try {
    const result = await input.execute(call);
    const [completed] = await db
      .update(agentToolCalls)
      .set({ status: "completed", result, finishedAt: new Date() })
      .where(eq(agentToolCalls.id, call.id))
      .returning();
    input.onChange?.(toolCallView(completed));
    return { call, result };
  } catch (error) {
    const [failed] = await db
      .update(agentToolCalls)
      .set({
        status: "failed",
        result: { error: String(error) },
        finishedAt: new Date(),
      })
      .where(eq(agentToolCalls.id, call.id))
      .returning();
    input.onChange?.(toolCallView(failed));
    throw error;
  }
}

export async function createApproval(input: {
  threadId: string;
  runId: string;
  toolCallId: string;
  actionType: string;
  payload: Record<string, unknown>;
  preview: Record<string, unknown>;
}) {
  const [row] = await getDb().insert(agentApprovals).values(input).returning();
  return approvalView(row);
}

export async function claimApproval(id: string) {
  const [row] = await getDb()
    .update(agentApprovals)
    .set({ status: "approved", resolvedAt: new Date() })
    .where(and(eq(agentApprovals.id, id), eq(agentApprovals.status, "pending")))
    .returning();
  return row ?? null;
}

export async function rejectApprovalWithPayload(id: string) {
  const [row] = await getDb()
    .update(agentApprovals)
    .set({
      status: "rejected",
      resolutionNote: "Rejected by the administrator.",
      resolvedAt: new Date(),
    })
    .where(and(eq(agentApprovals.id, id), eq(agentApprovals.status, "pending")))
    .returning();
  return row ?? null;
}

export async function resolveApproval(input: {
  id: string;
  status: "rejected" | "executed" | "failed";
  note?: string;
}) {
  const [row] = await getDb()
    .update(agentApprovals)
    .set({
      status: input.status,
      resolutionNote: input.note,
      resolvedAt: new Date(),
    })
    .where(eq(agentApprovals.id, input.id))
    .returning();
  return row ? approvalView(row) : null;
}

export async function deleteAssistantThread(id: string) {
  const [row] = await getDb()
    .delete(agentThreads)
    .where(eq(agentThreads.id, id))
    .returning({ id: agentThreads.id });
  return Boolean(row);
}

export async function renameAssistantThread(id: string, title: string) {
  const [row] = await getDb()
    .update(agentThreads)
    .set({ title })
    .where(eq(agentThreads.id, id))
    .returning();
  return row ? threadView(row) : null;
}

export async function setAssistantThreadPinned(id: string, pinned: boolean) {
  const [row] = await getDb()
    .update(agentThreads)
    .set({ pinnedAt: pinned ? new Date() : null })
    .where(eq(agentThreads.id, id))
    .returning();
  return row ? threadView(row) : null;
}
