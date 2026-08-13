"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleCheck,
  CircleX,
  LoaderCircle,
  PanelLeftOpen,
  Square,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
import { BippyMobileWorkspaceSidebar } from "@/components/admin/bippy-mobile-workspace-sidebar";
import { BippyIcon } from "@/components/bippy/bippy-icon";
import { CopilotMarkdown } from "@/components/admin/copilot-markdown";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type {
  AssistantApprovalView,
  AssistantMessageView,
  AssistantStreamEvent,
  AssistantThreadDetail,
  AssistantThreadSummary,
  AssistantToolCallView,
} from "@/lib/ai/types";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

const suggestions = [
  "Summarize what is currently published.",
  "Create a draft post about a project I just shipped.",
  "Review my project descriptions for clarity.",
] as const;

function modelLabel(model: string) {
  return model
    .replace(/^gpt-/i, "GPT ")
    .replaceAll("-", " ")
    .replace(/\bmini\b/i, "mini");
}

function previewTitle(approval: AssistantApprovalView) {
  const title = approval.preview.title;
  return typeof title === "string" ? title : approval.actionType;
}

const toolLabels: Record<string, string> = {
  read_portfolio_overview: "Reading your portfolio",
  read_content_item: "Reading content",
  create_project_draft: "Creating a project draft",
  create_post_draft: "Creating a writing draft",
  create_recognition_draft: "Creating a recognition draft",
  propose_project_update: "Preparing a project update",
  propose_post_update: "Preparing a writing update",
  propose_recognition_update: "Preparing a recognition update",
  propose_placement_change: "Preparing a placement change",
  propose_content_deletion: "Preparing a deletion request",
  propose_now_update: "Preparing a Now update",
  propose_seo_update: "Preparing an SEO update",
};

function ToolProgress({ toolCall }: { toolCall: AssistantToolCallView }) {
  const Icon =
    toolCall.status === "running"
      ? LoaderCircle
      : toolCall.status === "failed"
        ? CircleX
        : CircleCheck;

  return (
    <div className="flex items-center gap-2 py-1 text-[11.5px] text-muted-foreground">
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          toolCall.status === "running" && "animate-spin",
          toolCall.status === "failed" && "text-destructive",
        )}
        aria-hidden="true"
      />
      <span>{toolLabels[toolCall.toolName] ?? toolCall.toolName}</span>
      {toolCall.requiresApproval && toolCall.status === "completed" ? (
        <span className="font-mono text-[9.5px] uppercase tracking-wide">
          approval needed
        </span>
      ) : null}
    </div>
  );
}

function PreviewValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">None</span>;
  }
  const content =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[10.5px] leading-5">
      {content}
    </pre>
  );
}

function ApprovalRow({
  approval,
  busy,
  onDecision,
}: {
  approval: AssistantApprovalView;
  busy: boolean;
  onDecision: (decision: "approve" | "reject") => void;
}) {
  const pending = approval.status === "pending";
  const before = approval.preview.before ?? approval.preview.content;
  const after = approval.preview.after;

  return (
    <div className="border-b border-border/60 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 text-[13.5px] font-medium">
          {previewTitle(approval)}
        </p>
        <Badge
          variant={approval.status === "failed" ? "destructive" : "secondary"}
          className="rounded-md font-mono text-[10px] font-normal"
        >
          {approval.status}
        </Badge>
      </div>
      <details
        className="mt-2 text-[12px] text-muted-foreground"
        open={pending}
      >
        <summary className="w-fit cursor-pointer select-none hover:text-foreground">
          Review change
        </summary>
        {before !== undefined || after !== undefined ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 border-l border-border pl-3">
              <p className="mb-1.5 font-mono text-[9.5px] uppercase tracking-wide">
                Current
              </p>
              <PreviewValue value={before} />
            </div>
            <div className="min-w-0 border-l border-border pl-3">
              <p className="mb-1.5 font-mono text-[9.5px] uppercase tracking-wide">
                Proposed
              </p>
              <PreviewValue value={after} />
            </div>
          </div>
        ) : (
          <div className="mt-2 border-l border-border pl-3">
            <PreviewValue value={approval.preview} />
          </div>
        )}
      </details>
      {pending ? (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onDecision("approve")}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Check aria-hidden="true" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onDecision("reject")}
          >
            <X aria-hidden="true" />
            Reject
          </Button>
        </div>
      ) : approval.resolutionNote ? (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {approval.resolutionNote}
        </p>
      ) : null}
    </div>
  );
}

export function PortfolioCopilot({
  initialThreads,
  initialThreadId,
  configured,
  defaultModel,
  availableModels,
}: {
  initialThreads: AssistantThreadSummary[];
  initialThreadId?: string;
  configured: boolean;
  defaultModel: string;
  availableModels: string[];
}) {
  const router = useRouter();
  const adminBase = useAdminBase();
  const [threads, setThreads] = useState(initialThreads);
  const [threadsOpen, setThreadsOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    initialThreadId ?? null,
  );
  const [detail, setDetail] = useState<AssistantThreadDetail | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [streamingText, setStreamingText] = useState("");
  const [activeToolCalls, setActiveToolCalls] = useState<
    AssistantToolCallView[]
  >([]);
  const [loadingThread, setLoadingThread] = useState(Boolean(activeId));
  const [sending, setSending] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activeId) return;
    const controller = new AbortController();
    let active = true;
    setLoadingThread(true);
    fetch(`/api/admin/assistant/threads/${activeId}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the conversation.");
        return (await response.json()) as AssistantThreadDetail;
      })
      .then((thread) => {
        if (active) {
          setDetail(thread);
          setSelectedModel(thread.thread.model);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        toast.error(String(error));
      })
      .finally(() => {
        if (active) setLoadingThread(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [activeId]);

  const pendingApprovals = useMemo(
    () =>
      detail?.approvals.filter((approval) => approval.status === "pending") ??
      [],
    [detail?.approvals],
  );
  const modelOptions = useMemo(
    () =>
      availableModels.includes(selectedModel)
        ? availableModels
        : [selectedModel, ...availableModels],
    [availableModels, selectedModel],
  );

  function newConversation() {
    if (sending) return;
    setActiveId(null);
    setDetail(null);
    setLoadingThread(false);
    setPrompt("");
    setSelectedModel(defaultModel);
    setStreamingText("");
    setActiveToolCalls([]);
    router.replace(`${adminBase}/assistant`, { scroll: false });
  }

  function selectConversation(id: string) {
    setActiveId(id);
    const thread = threads.find((item) => item.id === id);
    if (thread) setSelectedModel(thread.model);
    router.replace(`${adminBase}/assistant?thread=${id}`, { scroll: false });
  }

  function stopGeneration() {
    if (!requestControllerRef.current) return;
    requestControllerRef.current?.abort();
    setStreamingText("");
    setActiveToolCalls([]);
    toast.info("Generation stopped.");
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const message = prompt.trim();
    if (!message || sending || !configured) return;
    setPrompt("");
    setSending(true);
    setStreamingText("");
    setActiveToolCalls([]);

    const optimistic: AssistantMessageView = {
      id: `local-${Date.now()}`,
      runId: null,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setDetail((current) =>
      current
        ? { ...current, messages: [...current.messages, optimistic] }
        : null,
    );

    const requestController = new AbortController();
    requestControllerRef.current = requestController;
    try {
      const response = await fetch("/api/admin/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeId ?? undefined,
          message,
          model: activeId ? undefined : selectedModel,
        }),
        signal: requestController.signal,
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "The assistant is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentThread: AssistantThreadSummary | null = null;
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw) continue;
          const item = JSON.parse(raw) as AssistantStreamEvent;
          if (item.type === "thread") {
            currentThread = item.thread;
            setActiveId(item.thread.id);
            setSelectedModel(item.thread.model);
            router.replace(`${adminBase}/assistant?thread=${item.thread.id}`, {
              scroll: false,
            });
            setDetail(
              (current) =>
                current ?? {
                  thread: item.thread,
                  messages: [optimistic],
                  toolCalls: [],
                  approvals: [],
                },
            );
            setThreads((rows) => [
              item.thread,
              ...rows.filter((row) => row.id !== item.thread.id),
            ]);
          } else if (item.type === "delta") {
            setStreamingText((text) => text + item.text);
          } else if (item.type === "tool") {
            setActiveToolCalls((current) => [
              ...current.filter((toolCall) => toolCall.id !== item.toolCall.id),
              item.toolCall,
            ]);
            setDetail((current) =>
              current
                ? {
                    ...current,
                    toolCalls: [
                      ...current.toolCalls.filter(
                        (toolCall) => toolCall.id !== item.toolCall.id,
                      ),
                      item.toolCall,
                    ],
                  }
                : current,
            );
          } else if (item.type === "approval") {
            setDetail((current) =>
              current
                ? {
                    ...current,
                    approvals: [...current.approvals, item.approval],
                  }
                : current,
            );
          } else if (item.type === "done") {
            if (currentThread) setActiveId(currentThread.id);
            setDetail((current) => {
              if (!current && currentThread) {
                return {
                  thread: currentThread,
                  messages: [optimistic, item.message],
                  toolCalls: [],
                  approvals: [],
                };
              }
              return current
                ? { ...current, messages: [...current.messages, item.message] }
                : current;
            });
            setStreamingText("");
            setActiveToolCalls([]);
          } else if (item.type === "error") {
            throw new Error(item.message);
          }
        }
        if (done) break;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStreamingText("");
        setActiveToolCalls([]);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Request failed.");
      setStreamingText("");
    } finally {
      requestControllerRef.current = null;
      setSending(false);
    }
  }

  async function decide(
    approval: AssistantApprovalView,
    decision: "approve" | "reject",
  ) {
    setApprovalBusy(approval.id);
    try {
      const response = await fetch(
        `/api/admin/assistant/approvals/${approval.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const body = (await response.json()) as {
        approval?: AssistantApprovalView;
        error?: string;
      };
      if (!response.ok || !body.approval) {
        throw new Error(body.error || "Could not resolve approval.");
      }
      setDetail((current) =>
        current
          ? {
              ...current,
              approvals: current.approvals.map((item) =>
                item.id === approval.id ? body.approval! : item,
              ),
            }
          : current,
      );
      toast.success(
        decision === "approve" ? "Change applied." : "Change rejected.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decision failed.");
    } finally {
      setApprovalBusy(null);
    }
  }

  async function removeThread() {
    if (!activeId || sending) return;
    const response = await fetch(`/api/admin/assistant/threads/${activeId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error("Could not delete the conversation.");
      return;
    }
    const remaining = threads.filter((thread) => thread.id !== activeId);
    setThreads(remaining);
    setActiveId(remaining[0]?.id ?? null);
    setDetail(null);
    setLoadingThread(Boolean(remaining[0]?.id));
  }

  return (
    <div
      className={cn(
        "grid size-full grid-cols-1 overflow-hidden",
        threadsOpen ? "lg:grid-cols-[210px_minmax(0,1fr)]" : "lg:grid-cols-1",
      )}
    >
      <BippyMobileWorkspaceSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        threads={threads}
        activeId={activeId}
        disabled={sending}
        onNewChat={newConversation}
        onSelectThread={selectConversation}
      />
      {threadsOpen ? (
        <div className="hidden min-h-0 lg:block">
          <BippyWorkspaceSidebar
            className="size-full"
            threads={threads}
            activeId={activeId}
            disabled={sending}
            onClose={() => setThreadsOpen(false)}
            onNewChat={newConversation}
            onSelectThread={selectConversation}
          />
        </div>
      ) : null}

      <section
        className="flex min-h-0 min-w-0 flex-col"
        aria-label="Bippy conversation"
      >
        <div className="flex min-h-14 items-center gap-2 border-b border-border/60 px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open Bippy sidebar"
            aria-controls="bippy-mobile-workspace-sidebar"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <PanelLeftOpen aria-hidden="true" />
          </Button>
          {!threadsOpen ? (
            <Button
              className="hidden lg:inline-flex"
              variant="ghost"
              size="icon-sm"
              aria-label="Open conversations"
              aria-controls="bippy-workspace-sidebar"
              aria-expanded={false}
              onClick={() => setThreadsOpen(true)}
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
          ) : null}
          {pendingApprovals.length ? (
            <Badge
              variant="secondary"
              className="rounded-md text-[10px] font-normal"
            >
              {pendingApprovals.length} pending
            </Badge>
          ) : null}
          {activeId ? (
            <Button
              className="ml-auto"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete conversation"
              onClick={removeThread}
              disabled={sending}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        <MessageScrollerProvider>
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-0 px-3 py-5 sm:px-4">
                {loadingThread ? (
                  <MessageScrollerItem className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <LoaderCircle
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    Loading conversation
                  </MessageScrollerItem>
                ) : detail?.messages.length ? (
                  <>
                    {detail.messages.map((message) => {
                      const calls = message.runId
                        ? detail.toolCalls.filter(
                            (toolCall) => toolCall.runId === message.runId,
                          )
                        : [];
                      return (
                        <MessageScrollerItem key={message.id}>
                          <article className="grid gap-2 border-b border-border/60 py-4 sm:grid-cols-[70px_minmax(0,1fr)]">
                            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                              {message.role === "user" ? "You" : "Bippy"}
                            </span>
                            <div className="min-w-0">
                              {message.role === "assistant" ? (
                                <CopilotMarkdown>
                                  {message.content}
                                </CopilotMarkdown>
                              ) : (
                                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-foreground">
                                  {message.content}
                                </p>
                              )}
                              {message.role === "assistant" && calls.length ? (
                                <div className="mt-3 border-l border-border pl-3">
                                  {calls.map((toolCall) => (
                                    <ToolProgress
                                      key={toolCall.id}
                                      toolCall={toolCall}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        </MessageScrollerItem>
                      );
                    })}
                    {sending ? (
                      <MessageScrollerItem scrollAnchor>
                        <article className="grid gap-2 border-b border-border/60 py-4 sm:grid-cols-[70px_minmax(0,1fr)]">
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                            Bippy
                          </span>
                          <div className="min-w-0">
                            {streamingText ? (
                              <CopilotMarkdown>{streamingText}</CopilotMarkdown>
                            ) : (
                              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                                <LoaderCircle
                                  className="size-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                                Thinking
                              </div>
                            )}
                            {activeToolCalls.length ? (
                              <div className="mt-3 border-l border-border pl-3">
                                {activeToolCalls.map((toolCall) => (
                                  <ToolProgress
                                    key={toolCall.id}
                                    toolCall={toolCall}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      </MessageScrollerItem>
                    ) : null}
                    {detail.approvals.length ? (
                      <MessageScrollerItem className="mt-5">
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                          Proposed actions
                        </p>
                        {detail.approvals.map((approval) => (
                          <ApprovalRow
                            key={approval.id}
                            approval={approval}
                            busy={approvalBusy === approval.id}
                            onDecision={(decision) =>
                              decide(approval, decision)
                            }
                          />
                        ))}
                      </MessageScrollerItem>
                    ) : null}
                  </>
                ) : (
                  <MessageScrollerItem className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
                    <BippyIcon className="size-7 text-foreground" />
                    <p className="mt-3 text-[13.5px] font-semibold leading-6 text-foreground">
                      Bippy can inspect the portfolio, create private drafts,
                      and prepare reviewed changes for approval.
                    </p>
                    <div className="mt-5 flex flex-col gap-1.5">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setPrompt(suggestion)}
                          className="rounded-md px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <form onSubmit={send} className="px-3 py-3 sm:px-4">
          <InputGroup className="mx-auto max-w-3xl rounded-lg bg-transparent shadow-none">
            <InputGroupTextarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about your portfolio…"
              rows={1}
              disabled={!configured}
              className="min-h-11 max-h-40 py-2.5 text-[13.5px]"
            />
            <InputGroupAddon
              align="block-end"
              className="justify-end gap-1 px-2.5 pb-2"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <InputGroupButton
                    type="button"
                    size="sm"
                    aria-label={`Choose model. Current model: ${modelLabel(selectedModel)}`}
                    disabled={sending}
                    className="max-w-48 gap-1 rounded-md px-2 font-mono text-[10.5px] text-foreground"
                  >
                    <span className="truncate">
                      {modelLabel(selectedModel)}
                    </span>
                    <ChevronDown data-icon="inline-end" aria-hidden="true" />
                  </InputGroupButton>
                </DialogTrigger>
                <DialogContent
                  showCloseButton={false}
                  className="max-w-[calc(100%-2rem)] gap-2 p-3 sm:max-w-xs"
                >
                  <DialogHeader className="px-1 pb-1 text-left">
                    <DialogTitle className="text-sm">Choose model</DialogTitle>
                    <DialogDescription className="text-xs">
                      {activeId
                        ? "The model is fixed for this conversation."
                        : "Select the model for this new conversation."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-0.5">
                    {modelOptions.map((availableModel) => {
                      const selected = availableModel === selectedModel;
                      const unavailable = Boolean(activeId) && !selected;

                      return (
                        <DialogClose asChild key={availableModel}>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={unavailable}
                            onClick={() => {
                              if (!activeId) setSelectedModel(availableModel);
                            }}
                            className="justify-between rounded-md px-3 font-mono text-xs font-normal"
                          >
                            {modelLabel(availableModel)}
                            {selected ? <Check aria-hidden="true" /> : null}
                          </Button>
                        </DialogClose>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
              {sending ? (
                <InputGroupButton
                  size="icon-sm"
                  aria-label="Stop generation"
                  title="Stop generation"
                  onClick={stopGeneration}
                  className="rounded-md bg-foreground text-background hover:bg-foreground/85 hover:text-background"
                >
                  <Square className="size-3 fill-current" aria-hidden="true" />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={!configured || !prompt.trim()}
                  className="rounded-md bg-foreground text-background hover:bg-foreground/85 hover:text-background"
                >
                  <ArrowUp aria-hidden="true" />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
      </section>
    </div>
  );
}
