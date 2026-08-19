import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import {
  completeAssistantRun,
  createAssistantTurn,
  failAssistantRun,
  getConversationState,
  saveConversationCompaction,
} from "@/lib/ai/repository";
import { getOpenAIPortfolioProvider } from "@/lib/ai/openai-provider";
import { getAssistantMemoryContext } from "@/lib/ai/memory";
import type {
  AssistantStreamEvent,
  AssistantToolCallView,
} from "@/lib/ai/types";
import { assistantMessageSchema } from "@/lib/ai/validation";
import { logServer } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function line(event: AssistantStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  await requireAdmin();
  const provider = getOpenAIPortfolioProvider();
  if (!provider.configured) {
    return NextResponse.json(
      {
        error:
          "OpenAI is not configured. Add OPENAI_API_KEY to the server environment.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = assistantMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const selectedModel = parsed.data.model ?? provider.defaultModel;
  if (
    !parsed.data.threadId &&
    !provider.availableModels.includes(selectedModel)
  ) {
    return NextResponse.json(
      { error: "That model is not available for Bippy." },
      { status: 400 },
    );
  }

  let turn: Awaited<ReturnType<typeof createAssistantTurn>>;
  try {
    turn = await createAssistantTurn({
      threadId: parsed.data.threadId,
      message: parsed.data.message,
      model: selectedModel,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamClosed = false;
      const send = (event: AssistantStreamEvent) => {
        if (streamClosed || request.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(line(event)));
        } catch {
          streamClosed = true;
        }
      };
      send({ type: "thread", thread: turn.thread });

      try {
        const context = {
          threadId: turn.thread.id,
          runId: turn.run.id,
          approvals: [],
          onToolChange: (toolCall: AssistantToolCallView) =>
            send({ type: "tool", toolCall }),
        };
        const [conversationState, memoryContext] = await Promise.all([
          getConversationState(turn.thread.id),
          getAssistantMemoryContext(),
        ]);
        const preparedConversation = await provider.prepareConversation({
          state: conversationState,
          model: turn.thread.model,
          signal: request.signal,
        });
        if (preparedConversation.compaction) {
          await saveConversationCompaction({
            threadId: turn.thread.id,
            ...preparedConversation.compaction,
          });
          logServer("info", "assistant.conversation_compacted", {
            threadId: turn.thread.id,
            compactedMessageCount:
              preparedConversation.compaction.compactedMessageCount,
            sourceTokens: preparedConversation.compaction.sourceTokens,
            summaryTokens: preparedConversation.compaction.summaryTokens,
          });
        }
        const result = await provider.stream({
          conversation: preparedConversation.input,
          memoryContext,
          model: turn.thread.model,
          context,
          signal: request.signal,
        });
        let content = "";
        const textStream = result.toTextStream({
          compatibleWithNodeStreams: true,
        });
        for await (const chunk of textStream) {
          const value = chunk.toString();
          content += value;
          send({ type: "delta", text: value });
        }
        await result.completed;
        if (result.error) throw result.error;

        for (const approval of context.approvals) {
          send({ type: "approval", approval });
        }
        const usage = result.runContext.usage;
        const message = await completeAssistantRun({
          threadId: turn.thread.id,
          runId: turn.run.id,
          content: content.trim() || "I completed the requested tool work.",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
        send({ type: "done", message });
      } catch (error) {
        if (request.signal.aborted) {
          await failAssistantRun(turn.run.id, "cancelled_by_admin");
          logServer("info", "assistant.run_cancelled", {
            runId: turn.run.id,
          });
          return;
        }
        logServer("error", "assistant.run_failed", {
          runId: turn.run.id,
          error: String(error),
        });
        await failAssistantRun(turn.run.id, String(error));
        send({
          type: "error",
          message: "The assistant could not complete that request.",
        });
      } finally {
        if (!streamClosed) {
          try {
            controller.close();
          } catch {
            // The browser may already have closed the stream after Stop.
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
