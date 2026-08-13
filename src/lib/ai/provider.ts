import "server-only";

import type { StreamedRunResult } from "@openai/agents";
import type { PortfolioAgentContext } from "@/lib/ai/tools";

export type ConversationMessage = {
  runId: string | null;
  role: "user" | "assistant";
  content: string;
};

export type ConversationCheckpoint = {
  summary: string;
  compactedMessageCount: number;
};

export type ConversationAuditItem = {
  runId: string;
  kind: "tool" | "approval";
  name: string;
  status: string;
  note?: string | null;
};

export type ConversationState = {
  messages: ConversationMessage[];
  checkpoint: ConversationCheckpoint | null;
  auditItems: ConversationAuditItem[];
};

export type PreparedConversation = {
  input: string;
  compaction?: {
    summary: string;
    compactedMessageCount: number;
    sourceTokens: number;
    summaryTokens: number;
  };
};

export type PortfolioAgentStream = StreamedRunResult<
  PortfolioAgentContext,
  // Providers keep their concrete agent type private. The route needs only the
  // common streamed-result surface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

export type PortfolioAssistantProvider = {
  id: "openai";
  configured: boolean;
  defaultModel: string;
  availableModels: string[];
  prepareConversation(input: {
    state: ConversationState;
    model: string;
    signal?: AbortSignal;
  }): Promise<PreparedConversation>;
  stream(input: {
    conversation: string;
    memoryContext: string;
    model: string;
    context: PortfolioAgentContext;
    signal?: AbortSignal;
  }): Promise<PortfolioAgentStream>;
};
