"use client";

import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { useWakaTimeStatus } from "@/components/bippy/use-wakatime-status";
import styles from "@/components/portfolio/wakatime-activity-strip.module.css";
import { cn } from "@/lib/utils";

const loadingBars = [18, 42, 28, 64, 38, 74, 52];

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  const roundedMinutes = Math.round(seconds / 60);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function dayLabel(date: string) {
  const parsed = Date.parse(`${date}T12:00:00.000Z`);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.DateTimeFormat("en", {
    weekday: "narrow",
    timeZone: "UTC",
  }).format(parsed);
}

function lastActiveLabel(value: string | null | undefined, now: number) {
  if (!value) return "No recent activity";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "No recent activity";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));

  if (minutes < 1) return "Last active just now";
  if (minutes < 60) return `Last active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last active ${days}d ago`;
}

export function WakaTimeActivityStrip() {
  const status = useWakaTimeStatus();
  const isOnline = status?.isCoding === true;
  const maximumSeconds = Math.max(
    1,
    ...(status?.days.map((day) => day.totalSeconds) ?? []),
  );
  const bars = status?.days.length
    ? status.days.map((day) => ({
        label: dayLabel(day.date),
        seconds: day.totalSeconds,
        height:
          day.totalSeconds > 0
            ? Math.max(8, (day.totalSeconds / maximumSeconds) * 100)
            : 3,
      }))
    : loadingBars.map((height, index) => ({
        label: ["M", "T", "W", "T", "F", "S", "S"][index] ?? "—",
        seconds: 0,
        height,
      }));
  const statusLabel = status ? (isOnline ? "Online" : "Offline") : "Syncing";

  return (
    <section className="mt-7" aria-labelledby="wakatime-heading">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl border border-border bg-card p-3.5 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="h-11 w-[68px] overflow-hidden rounded-lg border border-border bg-black">
            <span
              aria-hidden="true"
              className={cn(
                styles.face,
                isOnline ? styles.online : styles.offline,
              )}
            />
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isOnline ? "bg-accent-lime" : "bg-zinc-600",
              )}
              aria-hidden="true"
            />
            {statusLabel}
          </Badge>
        </div>

        <div className="min-w-0">
          <h2
            id="wakatime-heading"
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
          >
            Coding activity
          </h2>

          <dl className="mt-3 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              ["Today", formatDuration(status?.todaySeconds)],
              ["This week", formatDuration(status?.weekSeconds)],
              ["Daily avg", formatDuration(status?.dailyAverageSeconds)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="truncate text-[9px] text-muted-foreground sm:text-[10px]">
                  {label}
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium tabular-nums text-foreground sm:text-base">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className="mt-4"
            aria-label="Coding time over the last seven days"
          >
            <div className="flex h-12 items-end gap-1.5 border-b border-border pb-1 sm:gap-2">
              {bars.map((bar, index) => (
                <div
                  key={`${bar.label}-${index}`}
                  className="flex h-full min-w-0 flex-1 items-end"
                  title={`${bar.label}: ${formatDuration(bar.seconds)}`}
                >
                  <span
                    className={cn(
                      styles.bar,
                      "block w-full rounded-[2px]",
                      isOnline && index === bars.length - 1
                        ? "bg-accent-lime"
                        : "bg-zinc-600",
                      !status && "opacity-30",
                    )}
                    style={
                      {
                        height: `${bar.height}%`,
                        animationDelay: `${index * 40}ms`,
                      } as CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1.5 sm:gap-2" aria-hidden="true">
              {bars.map((bar, index) => (
                <span
                  key={`${bar.label}-${index}`}
                  className="min-w-0 flex-1 text-center font-mono text-[8px] text-muted-foreground"
                >
                  {bar.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="truncate">
              Most used: {status?.topLanguage?.name ?? "—"}
              {status?.topLanguage ? ` · ${status.topLanguage.percent}%` : null}
            </p>
            <p className="truncate">
              {isOnline
                ? "Active right now"
                : lastActiveLabel(
                    status?.lastActiveAt,
                    status ? Date.parse(status.checkedAt) : 0,
                  )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
