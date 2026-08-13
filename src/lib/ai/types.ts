export type AssistantProvider = "openai";

export type AssistantMemoryView = {
  id: string;
  label: string;
  content: string;
  category: "preference" | "fact" | "instruction";
  updatedAt: string;
};

export type AssistantThreadSummary = {
  id: string;
  title: string;
  provider: AssistantProvider;
  model: string;
  pinnedAt: string | null;
  updatedAt: string;
};

export type AssistantMessageView = {
  id: string;
  runId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AssistantToolCallView = {
  id: string;
  runId: string;
  toolName: string;
  status: "running" | "completed" | "failed";
  requiresApproval: boolean;
  createdAt: string;
};

export type AssistantApprovalView = {
  id: string;
  runId: string;
  actionType: string;
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
  preview: Record<string, unknown>;
  resolutionNote: string | null;
  requestedAt: string;
};

export type AssistantThreadDetail = {
  thread: AssistantThreadSummary;
  messages: AssistantMessageView[];
  toolCalls: AssistantToolCallView[];
  approvals: AssistantApprovalView[];
};

export type AssistantStreamEvent =
  | { type: "thread"; thread: AssistantThreadSummary }
  | { type: "delta"; text: string }
  | { type: "tool"; toolCall: AssistantToolCallView }
  | { type: "approval"; approval: AssistantApprovalView }
  | { type: "done"; message: AssistantMessageView }
  | { type: "error"; message: string };
