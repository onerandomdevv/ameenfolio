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
      value: hackathonWins ? plural(hackathonWins, "win") : null,
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
      {/* gap-px over a border-coloured background draws the hairlines, which
          keeps them correct in both the four-across and the wrapped two-column
          layout. Tailwind's divide-* utilities put a rule on the first cell of
          every wrapped row instead. The negative margin pulls the cell padding
          back so the leading value still lines up with the page text. */}
      <dl className="-mx-3 grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-background px-3 py-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {cell.label}
            </dt>
            <dd className="mt-2">
              <span
                className={cn(
                  "text-xl font-medium tabular-nums",
                  cell.value ? "text-accent-lime" : "text-muted-foreground",
                )}
              >
                {cell.value ?? "—"}
              </span>
              {/* Reserved even when empty so all four cells bottom out flat. */}
              <span className="mt-1 block min-h-4 text-[11px] leading-4 text-muted-foreground">
                {cell.value ? cell.sub : null}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
