"use client";

import { useState, type CSSProperties } from "react";
import { CalendarDays, LoaderCircle, RotateCcw } from "lucide-react";
import { useWakaTimeStatus } from "@/components/bippy/use-wakatime-status";
import styles from "@/components/portfolio/wakatime-activity-strip.module.css";
import { useWakaTimeHistory } from "@/components/portfolio/use-wakatime-history";
import { WakaTimeCalendar } from "@/components/portfolio/wakatime-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WakaTimeHistoryMode } from "@/lib/wakatime/status";
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

function formatLongDuration(seconds: number) {
  const roundedMinutes = Math.round(seconds / 60);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (hours === 0) return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
  if (minutes === 0) return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  return `${hours} ${hours === 1 ? "hr" : "hrs"} ${minutes} ${minutes === 1 ? "min" : "mins"}`;
}

function calendarDate(date: string) {
  const parsed = Date.parse(`${date}T12:00:00.000Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

function dayLabel(date: string) {
  const parsed = calendarDate(date);
  if (parsed === null) return "—";
  return new Intl.DateTimeFormat("en", {
    weekday: "narrow",
    timeZone: "UTC",
  }).format(parsed);
}

function dayDetails(date: string) {
  const parsed = calendarDate(date);
  if (parsed === null) return { weekday: "Coding activity", date };

  return {
    weekday: new Intl.DateTimeFormat("en", {
      weekday: "long",
      timeZone: "UTC",
    }).format(parsed),
    date: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed),
  };
}

function periodLabel(startDate: string, endDate: string) {
  const start = calendarDate(startDate);
  const end = calendarDate(endDate);
  if (start === null || end === null) return `${startDate} – ${endDate}`;

  const startYear = new Date(start).getUTCFullYear();
  const endYear = new Date(end).getUTCFullYear();
  const sameYear = startYear === endYear;
  const format = (value: number, includeYear: boolean) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: includeYear ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(value);

  return `${format(start, !sameYear)} – ${format(end, true)}`;
}

function groupDaysByWeek(days: Array<{ date: string; totalSeconds: number }>) {
  const groups = new Map<
    string,
    { startDate: string; endDate: string; totalSeconds: number }
  >();

  for (const day of days) {
    const parsed = calendarDate(day.date);
    if (parsed === null) continue;
    const sunday = new Date(parsed);
    sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
    const key = sunday.toISOString().slice(0, 10);
    const existing = groups.get(key);
    if (existing) {
      existing.endDate = day.date;
      existing.totalSeconds += day.totalSeconds;
    } else {
      groups.set(key, {
        startDate: day.date,
        endDate: day.date,
        totalSeconds: day.totalSeconds,
      });
    }
  }

  return [...groups.values()];
}

function lastActiveValue(value: string | null | undefined, now: number) {
  if (!value) return "No recent activity";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "No recent activity";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function WakaTimeActivityStrip() {
  const [selectedPeriod, setSelectedPeriod] = useState<{
    startDate: string;
    endDate: string;
    seconds: number;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selection, setSelection] = useState<{
    mode: WakaTimeHistoryMode;
    anchor: string;
  } | null>(null);
  const [draftMode, setDraftMode] = useState<WakaTimeHistoryMode>("week");
  const [draftAnchor, setDraftAnchor] = useState("");
  const status = useWakaTimeStatus();
  const {
    history,
    loading: historyLoading,
    error: historyError,
  } = useWakaTimeHistory(selection);
  const isOnline = status?.isCoding === true;
  const displayDays = selection ? (history?.days ?? []) : (status?.days ?? []);
  const chartPeriods =
    selection?.mode === "month" && history
      ? groupDaysByWeek(displayDays).map((period) => ({
          ...period,
          label: `${Number(period.startDate.slice(8))}–${Number(period.endDate.slice(8))}`,
          seconds: period.totalSeconds,
        }))
      : displayDays.map((day) => ({
          startDate: day.date,
          endDate: day.date,
          label: dayLabel(day.date),
          seconds: day.totalSeconds,
        }));
  const maximumSeconds = Math.max(
    1,
    ...chartPeriods.map((period) => period.seconds),
  );
  const bars = chartPeriods.length
    ? chartPeriods.map((period) => ({
        ...period,
        height:
          period.seconds > 0
            ? Math.max(8, (period.seconds / maximumSeconds) * 100)
            : 3,
      }))
    : loadingBars.map((height, index) => ({
        startDate: null,
        endDate: null,
        label: ["S", "M", "T", "W", "T", "F", "S"][index] ?? "—",
        seconds: 0,
        height,
      }));
  const statusLabel = status ? (isOnline ? "Online" : "Offline") : "Syncing";
  const todayDate = status?.todayDate ?? null;
  const elapsedDays = displayDays.filter(
    (day) => !todayDate || day.date <= todayDate,
  );
  const topCodingDay = elapsedDays.reduce<(typeof elapsedDays)[number] | null>(
    (top, day) =>
      day.totalSeconds > 0 && (!top || day.totalSeconds > top.totalSeconds)
        ? day
        : top,
    null,
  );
  const selectedDetails = selectedPeriod
    ? selectedPeriod.startDate === selectedPeriod.endDate
      ? dayDetails(selectedPeriod.startDate)
      : {
          weekday: "Weekly coding activity",
          date: periodLabel(selectedPeriod.startDate, selectedPeriod.endDate),
        }
    : null;
  const activeDays = displayDays.filter((day) => day.totalSeconds > 0).length;
  const summaryItems = selection
    ? [
        ["Total", formatDuration(history?.totalSeconds)],
        ["Daily avg", formatDuration(history?.dailyAverageSeconds)],
        ["Active days", history ? String(activeDays) : "—"],
      ]
    : [
        ["Today", formatDuration(status?.todaySeconds)],
        ["This week", formatDuration(status?.weekSeconds)],
        ["Daily avg", formatDuration(status?.dailyAverageSeconds)],
      ];
  const topLanguage = selection ? history?.topLanguage : status?.topLanguage;
  const rangeText = history
    ? periodLabel(history.startDate, history.endDate)
    : selection
      ? historyError
        ? "History unavailable"
        : "Loading history"
      : "Current week";

  const openHistory = () => {
    const anchor = selection?.anchor ?? status?.todayDate ?? "";
    setDraftMode(selection?.mode ?? "week");
    setDraftAnchor(anchor);
    setHistoryOpen(true);
  };

  return (
    <>
      <section className="mt-7" aria-labelledby="wakatime-heading">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {/* The section's name, so it takes the full-contrast ink rather
                than the muted grey the readings under it use: white on dark,
                near-black on light, both from the same token. */}
            <h2
              id="wakatime-heading"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-foreground"
            >
              Coding activity
            </h2>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-muted-foreground">
              {historyLoading ? (
                <LoaderCircle
                  className="size-2.5 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {rangeText}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={openHistory}
              className="h-6 rounded-[3px] px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
            >
              <CalendarDays aria-hidden="true" />
              History
            </Button>
            <Badge
              className={cn(
                "rounded-[3px] border-0 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] shadow-none",
                isOnline
                  ? "bg-signal text-signal-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>

        <div
          className="mt-3 grid grid-cols-4 gap-2 sm:gap-5"
          aria-label="Coding summary"
        >
          {summaryItems.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="truncate text-[9px] text-muted-foreground sm:text-[10px]">
                {label}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-foreground sm:text-base">
                {value}
              </p>
            </div>
          ))}
          <button
            type="button"
            disabled={!topCodingDay}
            onClick={() =>
              topCodingDay &&
              setSelectedPeriod({
                startDate: topCodingDay.date,
                endDate: topCodingDay.date,
                seconds: topCodingDay.totalSeconds,
              })
            }
            className="group min-h-11 min-w-0 text-left outline-none disabled:cursor-default"
            aria-label={
              topCodingDay
                ? `Top coding day, ${dayDetails(topCodingDay.date).weekday}, ${formatLongDuration(topCodingDay.totalSeconds)}`
                : "Top coding day unavailable"
            }
          >
            <span className="block truncate text-[9px] text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground sm:text-[10px]">
              Top coding day
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium tabular-nums text-foreground underline decoration-border underline-offset-4 transition-colors group-hover:text-signal group-focus-visible:text-signal sm:text-base">
              {formatDuration(topCodingDay?.totalSeconds)}
            </span>
          </button>
        </div>

        <div className="mt-3" aria-label={`Coding time for ${rangeText}`}>
          <div className="flex h-11 items-end gap-1.5 border-b border-border pb-1 sm:gap-2">
            {bars.map((bar, index) => {
              const startDate = bar.startDate;
              const endDate = bar.endDate;
              const isFutureDay = Boolean(
                endDate && todayDate && endDate > todayDate,
              );
              const details = startDate
                ? startDate === endDate
                  ? dayDetails(startDate)
                  : {
                      weekday: "Weekly coding activity",
                      date: periodLabel(startDate, endDate || startDate),
                    }
                : null;

              return (
                <button
                  type="button"
                  key={`${bar.label}-${index}`}
                  disabled={!startDate || !endDate || isFutureDay}
                  onClick={() =>
                    startDate &&
                    endDate &&
                    setSelectedPeriod({
                      startDate,
                      endDate,
                      seconds: bar.seconds,
                    })
                  }
                  className="group flex h-full min-w-0 flex-1 items-end outline-none disabled:cursor-default"
                  title={`${bar.label}: ${formatDuration(bar.seconds)}`}
                  aria-label={
                    details
                      ? `${details.weekday}, ${details.date}: ${formatLongDuration(bar.seconds)}`
                      : "Coding activity loading"
                  }
                >
                  <span
                    className={cn(
                      styles.bar,
                      "block w-full rounded-[2px] transition-colors",
                      startDate &&
                        !isFutureDay &&
                        "group-hover:bg-signal group-focus-visible:bg-signal",
                      !selection && isOnline && startDate === todayDate
                        ? "bg-signal"
                        : "bg-muted-foreground/40",
                      (selection ? !history : !status) && "opacity-30",
                    )}
                    style={
                      {
                        height: `${bar.height}%`,
                        animationDelay: `${index * 40}ms`,
                      } as CSSProperties
                    }
                  />
                </button>
              );
            })}
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

        <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <p className="min-w-0 truncate">
            Top language:{" "}
            {topLanguage ? (
              <span className="text-signal">
                {topLanguage.name} · {topLanguage.percent}%
              </span>
            ) : (
              "—"
            )}
          </p>
          <p className="shrink-0 truncate text-right">
            {isOnline ? (
              <>
                Active: <span className="text-signal">Right now</span>
              </>
            ) : (
              <>
                Last active:{" "}
                <span className="text-signal">
                  {lastActiveValue(
                    status?.lastActiveAt,
                    status ? Date.parse(status.checkedAt) : 0,
                  )}
                </span>
              </>
            )}
            {!selection && status?.statsStale ? " · Stats delayed" : null}
          </p>
        </div>
      </section>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[290px] gap-4 rounded-[4px] p-4">
          <DialogHeader className="gap-0 text-left">
            <DialogTitle className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-muted-foreground">
              History
            </DialogTitle>
            {/* Kept for the dialog's accessible description, but the grid says
                what to do far better than a sentence above it would. */}
            <DialogDescription className="sr-only">
              Choose a date to view its week, or a month to view its weeks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-1 rounded-[3px] bg-muted p-0.5">
            {(["week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraftMode(mode)}
                className={cn(
                  "h-7 rounded-[2px] font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
                  draftMode === mode
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <WakaTimeCalendar
            mode={draftMode}
            value={draftAnchor}
            maxDate={status?.todayDate ?? null}
            onChange={setDraftAnchor}
          />

          {/* Both controls sit together on the right. Alone in the far corner
              this one read as a caption rather than something pressable, which
              is a poor fate for the only way back to the live week. */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                setSelection(null);
                setHistoryOpen(false);
              }}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              This week
            </button>
            <button
              type="button"
              disabled={!draftAnchor}
              onClick={() => {
                setSelection({ mode: draftMode, anchor: draftAnchor });
                setHistoryOpen(false);
              }}
              className="rounded-[3px] bg-signal px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-signal-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
            >
              View
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedPeriod !== null}
        onOpenChange={(open) => !open && setSelectedPeriod(null)}
      >
        <DialogContent className="max-w-[320px] gap-5 rounded-[4px] p-5">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-base">
              {selectedDetails?.weekday ?? "Coding activity"}
            </DialogTitle>
            <DialogDescription>
              {selectedDetails?.date ?? "Daily WakaTime activity"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Coding time</span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {selectedPeriod
                ? formatLongDuration(selectedPeriod.seconds)
                : "—"}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
