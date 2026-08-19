import type { ReactNode } from "react";
import { Github } from "lucide-react";
import { StarGlyph } from "@/components/icons/glyph-icons";
import type { StatsSnapshot } from "@/db/schema";
import { cn } from "@/lib/utils";

type StatCell = {
  label: string;
  // Marks where the number comes from. Only the GitHub-sourced cells carry
  // one, so the icon says something rather than decorating every label.
  icon?: ReactNode;
  value: string | null;
  // Sits on the value's baseline rather than under it, for a qualifier that
  // belongs to the number itself — the dates the streak actually covers.
  valueNote?: string | null;
  subs?: ReactNode[];
};

type StatsStripProps = {
  // Null until a snapshot has been fetched, which needs GitHub credentials the
  // deployment may not have. The strip still renders: the two cells it feeds
  // fall back to a dash while the other two keep showing real numbers.
  snapshot: StatsSnapshot | null;
  hackathonWins: number;
  publishedProjectCount: number;
};

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" });

function toTime(date: Date | null | undefined) {
  if (!date) return null;
  const time = date instanceof Date ? date.getTime() : Date.parse(String(date));
  return Number.isFinite(time) ? time : null;
}

// "May 1 – May 8", collapsed to "May 1–8" when the streak sits inside one
// month. The cell has about twenty characters to play with, and repeating the
// month spends a quarter of them saying nothing.
function dateRange(start: Date | null, end: Date | null) {
  const from = toTime(start);
  const to = toTime(end);
  if (from === null || to === null) return null;

  const month = utc({ month: "short" });
  const dayOf = (time: number) => new Date(time).getUTCDate();

  return month.format(from) === month.format(to)
    ? `${month.format(from)} ${dayOf(from)}–${dayOf(to)}`
    : `${month.format(from)} ${dayOf(from)} – ${month.format(to)} ${dayOf(to)}`;
}

// Dates arrive from the driver as Date objects, but a malformed row must not be
// able to throw inside a render and take the whole homepage with it.
function sinceLabel(date: Date | null) {
  const time = toTime(date);
  if (time === null) return undefined;
  return `since ${utc({ month: "short", year: "numeric" }).format(time)}`;
}

export function StatsStrip({
  snapshot,
  hackathonWins,
  publishedProjectCount,
}: StatsStripProps) {
  const cells: StatCell[] = [
    {
      // Keyed on the snapshot existing, not on the number being truthy. Zero is
      // a real measurement — a broken streak or a quiet year — and rendering it
      // as a dash claims the data is missing when it is simply zero.
      label: "Contributions",
      icon: <Github className="size-3 shrink-0" aria-hidden="true" />,
      value: snapshot ? snapshot.contributions.toLocaleString("en-US") : null,
      subs: [sinceLabel(snapshot?.firstContributionAt ?? null)],
    },
    {
      label: "Current streak",
      icon: <Github className="size-3 shrink-0" aria-hidden="true" />,
      value: snapshot ? `${snapshot.currentStreak}d` : null,
      valueNote: dateRange(
        snapshot?.currentStreakStart ?? null,
        snapshot?.currentStreakEnd ?? null,
      ),
      subs: [
        snapshot?.longestStreak ? (
          <>
            {/* Sized to the digits' cap height and sat on their baseline. A
                box-centred 12px star spans further than an 11px capital in
                both directions, so it reads as misaligned even though the two
                boxes share a centre. */}
            <StarGlyph
              className="size-2.5 shrink-0 text-foreground"
              aria-hidden="true"
            />
            {/* The star carries the meaning visually; without this the row
                reads as a bare second number to a screen reader. */}
            <span className="sr-only">best streak </span>
            {[
              `${snapshot.longestStreak}D`,
              dateRange(snapshot.longestStreakStart, snapshot.longestStreakEnd),
            ]
              .filter(Boolean)
              .join(" · ")}
          </>
        ) : null,
      ],
    },
    {
      label: "Hackathons won",
      // "4x" rather than "4 wins": the label already says what was won, so the
      // value only has to carry the count, and it keeps the cell to one short
      // line at the four-across width.
      value: hackathonWins ? `${hackathonWins}×` : null,
    },
    {
      label: "Projects (prod)",
      value: publishedProjectCount
        ? publishedProjectCount.toLocaleString("en-US")
        : null,
    },
  ];

  return (
    <section className="mt-6" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Portfolio stats
      </h2>
      {/* A closed panel in the same language as ProjectCard: rounded-xl, one
          border, bg-card. gap-px over a border-coloured background draws the
          interior hairlines, which stay correct in both the four-across and the
          wrapped two-column layout — Tailwind's divide-* utilities instead put
          a rule on the first cell of every wrapped row. overflow-hidden is what
          lets the corner cells be clipped by the radius. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {cells.map((cell) => {
          // Filtered on their own content rather than on the value. Gating
          // them behind the value meant a broken streak hid the record beneath
          // it — the one line still worth reading at that moment.
          const subs = (cell.subs ?? []).filter(Boolean);
          const valueNote = cell.valueNote;
          const stacked = subs.length > 0 || Boolean(valueNote);

          return (
            <div key={cell.label} className="flex flex-col bg-card px-4 py-5">
              {/* Tracking is tighter than the other mono-caps headings on the
                  page: the icon costs 16px of a 98.6px cell, and without it
                  "Current streak" wraps to a second line, which drops that one
                  cell's value below the other three. */}
              <dt className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.03em] text-muted-foreground">
                {cell.icon}
                {cell.label}
              </dt>
              {/* A cell with a sub-line stacks under the label. One without has
                  nothing to fill the space, so its value centres in what is
                  left rather than hugging the label with a gap beneath it. */}
              <dd
                className={cn(
                  "flex flex-1 flex-col",
                  stacked
                    ? "mt-2.5"
                    : "items-center justify-center text-center",
                )}
              >
                {/* One line, note pushed to the right edge of the cell. It used
                    to wrap: at four across the row has 99px and the pair needed
                    102, so the date dropped under the figure. A smaller note
                    and a tighter gap fit it back on the baseline. */}
                <span className="flex items-baseline gap-x-1.5">
                  <span
                    className={cn(
                      "text-2xl font-medium tabular-nums",
                      cell.value ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {cell.value ?? "—"}
                  </span>
                  {valueNote ? (
                    <span className="ml-auto shrink-0 whitespace-nowrap text-[10px] leading-4 text-muted-foreground">
                      {valueNote}
                    </span>
                  ) : null}
                </span>
                {subs.map((line, index) => (
                  <span
                    key={index}
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] leading-4 text-muted-foreground",
                      index === 0 ? "mt-1.5" : "mt-0.5",
                    )}
                  >
                    {line}
                  </span>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
