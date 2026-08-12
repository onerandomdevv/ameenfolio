import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the shape every admin screen shares, so switching pages does not
// shift the layout underneath you: a title with its controls on the right, then
// a divided list of rows. Measurements are taken from AdminPage and ListRow —
// the header's mb-5, the rows' py-3 and their size-5 mark — so the placeholder
// occupies the same space the content will.
//
// The navigation is not drawn: it lives in the layout and is already on screen.
export default function AdminLoading() {
  return (
    <>
      <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Skeleton className="h-[19px] w-28" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-12 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </header>

      <div className="border-t border-border/60">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-x-3 border-b border-border/60 py-3"
          >
            <Skeleton className="size-5 shrink-0 rounded-md" />
            {/* A fixed height rather than letting the two bars set it: a real
                row's height comes from its text line boxes, which bars of the
                same nominal size do not reproduce. Fixing the column at their
                measured 39px keeps the row at 64px, so nothing jumps when the
                content arrives. */}
            <div className="flex min-h-[39px] min-w-0 flex-1 flex-col justify-center gap-1.5">
              {/* The two lines a row carries: its name, then the description or
                  route under it. Widths vary so the list does not read as a
                  printed grid. */}
              <Skeleton
                className="h-[13px] rounded-sm"
                style={{ width: `${[42, 30, 52, 36][index]}%` }}
              />
              <Skeleton
                className="h-[11px] rounded-sm"
                style={{ width: `${[64, 48, 58, 70][index]}%` }}
              />
            </div>
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </>
  );
}
