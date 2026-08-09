import type { StatsSnapshot } from "@/db/schema";
import { cn } from "@/lib/utils";

type StatCell = {
  label: string;
  value: string | null;
  sub?: string;
};

type StatsStripProps = {
  // Null until a snapshot has been fetched, which needs GitHub credentials the
  // deployment may not have. The strip still renders: the two cells it feeds
  // fall back to a dash while the other two keep showing real numbers.
  snapshot: StatsSnapshot | null;
  hackathonWins: number;
  publishedProjectCount: number;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Dates arrive from the driver as Date objects, but a malformed row must not be
// able to throw inside a render and take the whole homepage with it.
function sinceLabel(date: Date | null) {
  if (!date) return undefined;
  const time = date instanceof Date ? date.getTime() : Date.parse(String(date));
  if (!Number.isFinite(time)) return undefined;
  return `since ${new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(time)}`;
}

export function StatsStrip({
  snapshot,
  hackathonWins,
  publishedProjectCount,
}: StatsStripProps) {
  const cells: StatCell[] = [
    {
      label: "Contributions",
      value: snapshot?.contributions
        ? snapshot.contributions.toLocaleString("en-US")
        : null,
      sub: sinceLabel(snapshot?.firstContributionAt ?? null),
    },
    {
      label: "Workrate",
      value: snapshot?.currentStreak
        ? plural(snapshot.currentStreak, "day")
        : null,
      sub: snapshot?.longestStreak
        ? `${snapshot.longestStreak}d best streak`
        : undefined,
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
          const sub = cell.value ? cell.sub : null;

          return (
            <div key={cell.label} className="flex flex-col bg-card px-4 py-5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                {cell.label}
              </dt>
              {/* A cell with a sub-line stacks under the label. One without has
                  nothing to fill the space, so its value centres in what is
                  left rather than hugging the label with a gap beneath it. */}
              <dd
                className={cn(
                  "flex flex-1 flex-col",
                  sub ? "mt-2.5" : "items-center justify-center text-center",
                )}
              >
                <span
                  className={cn(
                    "text-2xl font-medium tabular-nums",
                    cell.value ? "text-accent-lime" : "text-muted-foreground",
                  )}
                >
                  {cell.value ?? "—"}
                </span>
                {sub ? (
                  <span className="mt-1.5 block text-[11px] leading-4 text-muted-foreground">
                    {sub}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
