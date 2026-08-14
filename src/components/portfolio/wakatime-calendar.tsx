"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WakaTimeHistoryMode } from "@/lib/wakatime/status";
import { cn } from "@/lib/utils";

const weekdayInitials = ["S", "M", "T", "W", "T", "F", "S"] as const;
const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Built once. A formatter per cell would rebuild it forty-odd times a render.
const dayLabelFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Every date here is UTC, matching the strip and the history API. A calendar
 * built on local time would show a visitor west of UTC a grid one day out of
 * step with the bars it is choosing between.
 */
function isoOf(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function shiftDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sundayOf(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return shiftDays(value, -date.getUTCDay());
}

function partsOf(value: string, fallback: string) {
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
  const parsed = Date.parse(`${source}T12:00:00.000Z`);
  const date = new Date(Number.isFinite(parsed) ? parsed : Date.now());
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

type WakaTimeCalendarProps = {
  mode: WakaTimeHistoryMode;
  /** The chosen anchor, `YYYY-MM-DD`. Empty means nothing picked yet. */
  value: string;
  /** Today, `YYYY-MM-DD`. Nothing after it can be chosen. */
  maxDate: string | null;
  onChange: (value: string) => void;
};

export function WakaTimeCalendar({
  mode,
  value,
  maxDate,
  onChange,
}: WakaTimeCalendarProps) {
  const today = maxDate ?? new Date().toISOString().slice(0, 10);
  // Where the grid is looking, which is not what is selected: paging back
  // through months should not change the answer until a day is pressed.
  const [view, setView] = useState(() => partsOf(value, today));

  const monthStart = isoOf(view.year, view.month, 1);
  const gridStart = sundayOf(monthStart);
  const daysInMonth = new Date(
    Date.UTC(view.year, view.month + 1, 0),
  ).getUTCDate();
  const leadingBlanks = new Date(`${monthStart}T12:00:00.000Z`).getUTCDay();
  // Only the rows this month actually reaches into, so February does not leave
  // an empty band under it.
  const rows = Math.ceil((leadingBlanks + daysInMonth) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, index) =>
    shiftDays(gridStart, index),
  );

  // In week mode the whole Sunday–Saturday run reads as chosen, because that
  // is the range the chart will draw — picking a Wednesday is picking its week.
  const selectedWeekStart =
    mode === "week" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? sundayOf(value)
      : null;
  const selectedWeekEnd = selectedWeekStart
    ? shiftDays(selectedWeekStart, 6)
    : null;
  const selectedMonth =
    mode === "month" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value.slice(0, 7)
      : null;

  const stepMonth = (delta: number) => {
    const next = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  const heading =
    mode === "week"
      ? `${new Intl.DateTimeFormat("en", {
          month: "long",
          timeZone: "UTC",
        }).format(Date.parse(`${monthStart}T12:00:00.000Z`))} ${view.year}`
      : String(view.year);

  // Both modes stop at 2015, comfortably before WakaTime existed. Week mode
  // could previously page back forever, into years that can only ever be empty.
  const canGoBack =
    mode === "week"
      ? isoOf(view.year, view.month, 1) > "2015-01-01"
      : view.year > 2015;
  const canGoForward =
    mode === "week"
      ? isoOf(view.year, view.month + 1, 1) <= today
      : view.year < Number(today.slice(0, 4));

  return (
    <div className="select-none">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() =>
            mode === "week"
              ? stepMonth(-1)
              : setView((current) => ({ ...current, year: current.year - 1 }))
          }
          aria-label={mode === "week" ? "Previous month" : "Previous year"}
          className="grid size-7 place-items-center rounded-[3px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        {/* Announced on change so a screen reader following the arrows hears
            where the grid moved to, not just that a button was pressed. */}
        <p
          aria-live="polite"
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-foreground"
        >
          {heading}
        </p>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() =>
            mode === "week"
              ? stepMonth(1)
              : setView((current) => ({ ...current, year: current.year + 1 }))
          }
          aria-label={mode === "week" ? "Next month" : "Next year"}
          className="grid size-7 place-items-center rounded-[3px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {mode === "week" ? (
        <div className="mt-3">
          <div className="grid grid-cols-7" aria-hidden="true">
            {weekdayInitials.map((initial, index) => (
              <span
                key={index}
                className="py-1 text-center font-mono text-[9px] text-muted-foreground"
              >
                {initial}
              </span>
            ))}
          </div>
          <div className="mt-0.5 grid grid-cols-7 gap-y-0.5">
            {cells.map((date) => {
              const outside = date.slice(0, 7) !== monthStart.slice(0, 7);
              const future = date > today;
              const inWeek = Boolean(
                selectedWeekStart &&
                selectedWeekEnd &&
                date >= selectedWeekStart &&
                date <= selectedWeekEnd,
              );
              const isAnchor = date === value;

              return (
                <button
                  key={date}
                  type="button"
                  disabled={future}
                  onClick={() => {
                    onChange(date);
                    if (outside) setView(partsOf(date, today));
                  }}
                  aria-pressed={inWeek}
                  // The visible label is a bare number and the weekday header
                  // is decorative, so without this a screen reader announces
                  // "12" with no month or year behind it.
                  aria-label={dayLabelFormat.format(
                    Date.parse(`${date}T12:00:00.000Z`),
                  )}
                  className={cn(
                    "h-7 rounded-[3px] text-center font-mono text-[10px] tabular-nums transition-colors",
                    "disabled:pointer-events-none disabled:opacity-25",
                    inWeek
                      ? "bg-signal/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    // A day from a neighbouring month still belongs to the week
                    // being highlighted, so it dims only when it is outside it.
                    outside && !inWeek && "opacity-40",
                    isAnchor && "bg-signal font-medium text-signal-foreground",
                  )}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-1">
          {monthLabels.map((label, index) => {
            const first = isoOf(view.year, index, 1);
            const future = first > today;
            const selected = first.slice(0, 7) === selectedMonth;

            return (
              <button
                key={label}
                type="button"
                disabled={future}
                onClick={() => onChange(first)}
                // Selection was carried by colour alone here, unlike the day
                // cells, which have said `aria-pressed` from the start.
                aria-pressed={selected}
                aria-label={`${label} ${view.year}`}
                className={cn(
                  "h-9 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                  "disabled:pointer-events-none disabled:opacity-25",
                  selected
                    ? "bg-signal font-medium text-signal-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
