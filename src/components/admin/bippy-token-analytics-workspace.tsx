"use client";

import { useState } from "react";
import { BarChart3, PanelLeftOpen } from "lucide-react";
import { BippyMobileWorkspaceSidebar } from "@/components/admin/bippy-mobile-workspace-sidebar";
import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { TokenAnalytics, TokenPeriod } from "@/lib/ai/analytics";
import type { AssistantThreadSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const exactNumberFormatter = new Intl.NumberFormat();

function tokenValue(value: number) {
  return numberFormatter.format(value);
}

function PeriodSummary({
  label,
  period,
}: {
  label: string;
  period: TokenPeriod;
}) {
  return (
    <div className="border-b border-border/60 py-4 first:border-t">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {exactNumberFormatter.format(period.runs)} runs
        </p>
      </div>
      <p className="mt-1 text-xl font-semibold tracking-tight">
        {tokenValue(period.totalTokens)}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        {tokenValue(period.inputTokens)} input ·{" "}
        {tokenValue(period.outputTokens)} output
      </p>
    </div>
  );
}

function weekday(day: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

function TokenAnalyticsContent({ analytics }: { analytics: TokenAnalytics }) {
  const maxDailyTokens = Math.max(
    1,
    ...analytics.daily.map((day) => day.totalTokens),
  );
  const maxModelTokens = Math.max(
    1,
    ...analytics.models.map((model) => model.totalTokens),
  );

  if (!analytics.allTime.runs && !analytics.failedRuns) {
    return (
      <Empty className="min-h-72 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3 aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No token usage yet</EmptyTitle>
          <EmptyDescription>
            Completed Bippy conversations will appear here with their input and
            output token usage.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="token-overview-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              id="token-overview-heading"
              className="text-[15px] font-semibold"
            >
              Token Analytics
            </h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Bippy API usage recorded by the portfolio.
            </p>
          </div>
          {analytics.failedRuns ? (
            <Badge
              variant="secondary"
              className="rounded-sm font-mono text-[9px]"
            >
              {analytics.failedRuns} failed
            </Badge>
          ) : null}
        </div>

        <div className="mt-5 grid sm:grid-cols-3 sm:gap-x-6">
          <PeriodSummary label="Today" period={analytics.today} />
          <PeriodSummary label="This month" period={analytics.month} />
          <PeriodSummary label="All time" period={analytics.allTime} />
        </div>
      </section>

      <section aria-labelledby="daily-token-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="daily-token-heading" className="text-[13px] font-semibold">
            Last seven days
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            Lagos time
          </span>
        </div>
        <div className="mt-3 border-t border-border/60">
          {analytics.daily.map((day) => (
            <div
              key={day.day}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-3 border-b border-border/60 py-2.5"
            >
              <span className="font-mono text-[10px] text-muted-foreground">
                {weekday(day.day)}
              </span>
              <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm bg-foreground transition-[width]"
                  style={{
                    width: `${day.totalTokens ? Math.max(3, (day.totalTokens / maxDailyTokens) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className="text-right font-mono text-[10px] text-muted-foreground">
                {tokenValue(day.totalTokens)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="model-token-heading">
        <h2 id="model-token-heading" className="text-[13px] font-semibold">
          Models
        </h2>
        <div className="mt-3 border-t border-border/60">
          {analytics.models.map((model) => (
            <div key={model.model} className="border-b border-border/60 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="truncate font-mono text-[11px]">
                  {model.model}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {tokenValue(model.totalTokens)} · {model.runs} runs
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm bg-foreground"
                  style={{
                    width: `${(model.totalTokens / maxModelTokens) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="compaction-token-heading">
        <h2 id="compaction-token-heading" className="text-[13px] font-semibold">
          Conversation compaction
        </h2>
        <div className="mt-3 grid border-t border-border/60 sm:grid-cols-3 sm:gap-x-6">
          <div className="border-b border-border/60 py-3">
            <p className="text-[11px] text-muted-foreground">Checkpoints</p>
            <p className="mt-1 font-mono text-sm">
              {analytics.compaction.count}
            </p>
          </div>
          <div className="border-b border-border/60 py-3">
            <p className="text-[11px] text-muted-foreground">Source tokens</p>
            <p className="mt-1 font-mono text-sm">
              {tokenValue(analytics.compaction.sourceTokens)}
            </p>
          </div>
          <div className="border-b border-border/60 py-3">
            <p className="text-[11px] text-muted-foreground">Context reduced</p>
            <p className="mt-1 font-mono text-sm">
              {tokenValue(analytics.compaction.reducedTokens)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] leading-5 text-muted-foreground">
          Reduction compares compacted source tokens with stored checkpoint
          tokens. OpenAI billing remains the authoritative usage record.
        </p>
      </section>
    </div>
  );
}

export function BippyTokenAnalyticsWorkspace({
  threads,
  analytics,
}: {
  threads: AssistantThreadSummary[];
  analytics: TokenAnalytics;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "size-full overflow-hidden",
        sidebarOpen && "lg:grid lg:grid-cols-[210px_minmax(0,1fr)]",
      )}
    >
      <BippyMobileWorkspaceSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        threads={threads}
      />
      {sidebarOpen ? (
        <div className="hidden min-h-0 lg:block">
          <BippyWorkspaceSidebar
            className="size-full"
            threads={threads}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      ) : null}

      <section
        className="min-h-0 overflow-y-auto"
        aria-label="Bippy token analytics"
      >
        <div className="mx-auto w-full max-w-[780px] px-5 py-4 sm:px-7">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open Bippy sidebar"
            aria-controls="bippy-mobile-workspace-sidebar"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
            className="mb-3 lg:hidden"
          >
            <PanelLeftOpen aria-hidden="true" />
          </Button>
          {!sidebarOpen ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open Bippy sidebar"
              aria-controls="bippy-workspace-sidebar"
              aria-expanded={false}
              onClick={() => setSidebarOpen(true)}
              className="mb-3 hidden lg:inline-flex"
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
          ) : null}
          <TokenAnalyticsContent analytics={analytics} />
        </div>
      </section>
    </div>
  );
}
