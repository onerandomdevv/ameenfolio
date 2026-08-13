import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminHref } from "@/lib/admin-path";
import { getMcpConnectionActivity } from "@/lib/mcp/connections";

export const metadata: Metadata = {
  title: "MCP activity",
  description: "Review activity from a private portfolio MCP client.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

function requestedPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(
    Array.isArray(value) ? value[0] : (value ?? "1"),
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readable(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function duration(start: string, end: string | null) {
  if (!end) return null;
  const milliseconds = Math.max(
    0,
    new Date(end).getTime() - new Date(start).getTime(),
  );
  if (milliseconds < 1_000) return `${milliseconds} ms`;
  return `${(milliseconds / 1_000).toFixed(milliseconds < 10_000 ? 1 : 0)} s`;
}

export default async function McpActivityPage({ params, searchParams }: Props) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const result = await getMcpConnectionActivity(
    clientId,
    requestedPage(query.page),
  );
  if (!result) notFound();

  const mcpHref = await adminHref("/mcp");
  const activityHref = `${mcpHref}/${encodeURIComponent(clientId)}/activity`;

  return (
    <section aria-labelledby="mcp-activity-heading">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={mcpHref}>
          <ArrowLeft aria-hidden="true" />
          MCP
        </Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="mcp-activity-heading" className="text-[15px] font-semibold">
              {result.connection.clientName} activity
            </h1>
            <Badge
              variant={result.connection.active ? "outline" : "secondary"}
              className="rounded-sm font-mono text-[9px]"
            >
              {result.connection.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {result.total.toLocaleString()} external tool calls. Sensitive
            payloads and credentials are never shown.
          </p>
          <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
            {result.connection.clientId}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {result.activity.length ? (
          result.activity.map((item) => {
            const elapsed = duration(item.createdAt, item.finishedAt);
            return (
              <article
                key={item.id}
                className="border-b border-border/60 py-4 first:border-t"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm border border-border/60">
                    <Activity
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[13.5px] font-medium">
                        {readable(item.toolName)}
                      </h2>
                      <Badge
                        variant={
                          item.status === "failed" ? "destructive" : "secondary"
                        }
                        className="rounded-sm font-mono text-[9px]"
                      >
                        {item.status}
                      </Badge>
                      {item.approvalStatus ? (
                        <Badge
                          variant="outline"
                          className="rounded-sm font-mono text-[9px]"
                        >
                          Approval: {item.approvalStatus}
                        </Badge>
                      ) : null}
                    </div>
                    {item.actionType ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {readable(item.actionType)}
                      </p>
                    ) : null}
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                      {dateTime(item.createdAt)}
                      {elapsed ? ` · ${elapsed}` : ""}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="grid min-h-64 place-items-center border-y border-border/60 text-center">
            <div>
              <Activity
                className="mx-auto size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-[13.5px] font-medium">No activity yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Tool calls from this connection will appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      {result.totalPages > 1 ? (
        <nav
          className="mt-4 flex items-center justify-between gap-3"
          aria-label="MCP activity pages"
        >
          <Button
            variant="outline"
            size="sm"
            asChild={result.page > 1}
            disabled={result.page <= 1}
          >
            {result.page > 1 ? (
              <Link href={`${activityHref}?page=${result.page - 1}`}>
                <ChevronLeft aria-hidden="true" />
                Previous
              </Link>
            ) : (
              <span>
                <ChevronLeft aria-hidden="true" />
                Previous
              </span>
            )}
          </Button>
          <span className="font-mono text-[10px] text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            asChild={result.page < result.totalPages}
            disabled={result.page >= result.totalPages}
          >
            {result.page < result.totalPages ? (
              <Link href={`${activityHref}?page=${result.page + 1}`}>
                Next
                <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <span>
                Next
                <ChevronRight aria-hidden="true" />
              </span>
            )}
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
