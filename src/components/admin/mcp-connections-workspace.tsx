"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Activity, Cable, Check, RefreshCw, Unplug, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cleanMcpCredentials,
  disconnectMcpConnection,
} from "@/app/admin/actions/mcp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { McpConnectionSummary } from "@/lib/mcp/connections";
import type { McpPendingApproval } from "@/lib/ai/types";
import { CopilotMarkdown } from "@/components/admin/copilot-markdown";
import { useAdminBase } from "@/lib/use-admin-base";

function dateTime(value: string | null) {
  if (!value) return "Never used";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ConnectionRow({ connection }: { connection: McpConnectionSummary }) {
  const router = useRouter();
  const base = useAdminBase();
  const [pending, startTransition] = useTransition();

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectMcpConnection(connection.clientId);
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="border-b border-border/60 py-4 first:border-t">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-medium">{connection.clientName}</p>
            <Badge
              variant={connection.active ? "outline" : "secondary"}
              className="rounded-sm font-mono text-[9px]"
            >
              {connection.status === "connected"
                ? "Connected"
                : connection.status === "pending"
                  ? "Pending authorization"
                  : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
            {connection.clientId}
          </p>
          <p className="mt-2 break-all text-[11px] text-muted-foreground">
            {connection.redirectUris.join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {connection.scopes.map((scope) => (
              <Badge
                key={scope}
                variant="secondary"
                className="rounded-sm font-mono text-[9px]"
              >
                {scope}
              </Badge>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            Last activity: {dateTime(connection.lastUsedAt)} · Registered:{" "}
            {dateTime(connection.connectedAt)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {connection.active ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={pending}>
                  <Unplug aria-hidden="true" />
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Disconnect {connection.clientName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Its access and refresh tokens will stop working immediately.
                    A new owner-approved OAuth connection is required to restore
                    access.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={disconnect}>
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`${base}/mcp/${encodeURIComponent(connection.clientId)}/activity`}
            >
              <Activity aria-hidden="true" />
              Activity
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function previewValue(approval: McpPendingApproval) {
  const after = approval.preview.after;
  if (!after || typeof after !== "object") return null;
  const values = after as Record<string, unknown>;
  return {
    title: typeof values.title === "string" ? values.title : null,
    body: typeof values.bodyMarkdown === "string" ? values.bodyMarkdown : null,
  };
}

function McpApprovalQueue({
  initialApprovals,
}: {
  initialApprovals: McpPendingApproval[];
}) {
  const router = useRouter();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setApprovals(initialApprovals);
  }, [initialApprovals]);

  async function decide(
    approval: McpPendingApproval,
    decision: "approve" | "reject",
  ) {
    setBusyId(approval.id);
    try {
      const response = await fetch(
        `/api/admin/assistant/approvals/${approval.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(body?.error || "Could not resolve approval.");
      setApprovals((items) => items.filter((item) => item.id !== approval.id));
      toast.success(
        decision === "approve"
          ? "MCP proposal approved and applied."
          : "MCP proposal rejected.",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resolve approval.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!approvals.length) return null;

  return (
    <section className="mt-8" aria-labelledby="mcp-approvals-heading">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="mcp-approvals-heading" className="text-[13px] font-semibold">
            Pending MCP approvals
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Review proposals from external MCP clients. These are separate from
            Bippy conversations.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-sm font-mono text-[9px]">
          {approvals.length} pending
        </Badge>
      </div>
      <div className="mt-3 border-t border-border/60">
        {approvals.map((approval) => {
          const preview = previewValue(approval);
          return (
            <article
              key={approval.id}
              className="border-b border-border/60 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">
                    {preview?.title || approval.actionType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {approval.clientName} ·{" "}
                    {approval.actionType.replaceAll("_", " ")}
                  </p>
                  {preview?.body ? (
                    <div className="mt-3 max-h-56 overflow-y-auto border-l-2 border-border/60 pl-3 text-muted-foreground">
                      <CopilotMarkdown className="text-[12px] leading-5">
                        {preview.body}
                      </CopilotMarkdown>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === approval.id}
                    onClick={() => void decide(approval, "reject")}
                  >
                    <X aria-hidden="true" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === approval.id}
                    onClick={() => void decide(approval, "approve")}
                  >
                    <Check aria-hidden="true" />
                    Approve
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionsContent({
  connections,
}: {
  connections: McpConnectionSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function clean() {
    startTransition(async () => {
      const result = await cleanMcpCredentials();
      const count = Object.values(result.removed).reduce(
        (sum, value) => sum + value,
        0,
      );
      toast.success(
        count
          ? `Removed ${count} expired OAuth records.`
          : "No expired OAuth records found.",
      );
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[15px] font-semibold">MCP</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Registered clients and their access to the portfolio tools.
          </p>
        </div>
        <Button
          className="ml-auto"
          variant="outline"
          size="sm"
          onClick={clean}
          disabled={pending}
          title="Remove expired credentials and abandoned inactive clients"
        >
          <RefreshCw
            className={pending ? "animate-spin" : undefined}
            aria-hidden="true"
          />
          Clean expired
        </Button>
      </div>

      <div className="mt-5">
        {connections.length ? (
          connections.map((connection) => (
            <ConnectionRow key={connection.clientId} connection={connection} />
          ))
        ) : (
          <div className="grid min-h-64 place-items-center border-y border-border/60 text-center">
            <div>
              <Cable
                className="mx-auto size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-[13.5px] font-medium">
                No MCP connections
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Authorized ChatGPT, Codex, or Claude clients will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function McpConnectionsWorkspace({
  connections,
  approvals,
}: {
  connections: McpConnectionSummary[];
  approvals: McpPendingApproval[];
}) {
  return (
    <section aria-label="MCP connections">
      <McpApprovalQueue initialApprovals={approvals} />
      <ConnectionsContent connections={connections} />
    </section>
  );
}
