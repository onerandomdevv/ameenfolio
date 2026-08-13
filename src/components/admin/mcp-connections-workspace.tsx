"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Activity, Cable, RefreshCw, Unplug } from "lucide-react";
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
            Registered clients and their access to Bippy&apos;s portfolio tools.
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
}: {
  connections: McpConnectionSummary[];
}) {
  return (
    <section aria-label="MCP connections">
      <ConnectionsContent connections={connections} />
    </section>
  );
}
