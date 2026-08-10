import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the homepage: same max-w-xl column, same left alignment, same order
// of blocks. A skeleton that does not match what replaces it is worse than
// none — the page appears to jump on load rather than settle.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
      {/* PortfolioNav is right-aligned; a left-aligned bar here is exactly
          the kind of jump a skeleton is supposed to prevent. */}
      <div className="flex justify-end">
        <Skeleton className="h-4 w-32" />
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-4 sm:gap-5">
          <Skeleton className="size-24 rounded-[22%] sm:size-28" />
          <div className="flex min-h-24 flex-1 flex-col justify-center gap-3 sm:min-h-28">
            <Skeleton className="h-9 w-52 sm:h-11" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        <div className="mt-8 grid gap-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-5 flex flex-wrap gap-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-28" />
        </div>
      </section>

      <Skeleton className="mt-6 h-[132px] w-full rounded-xl" />

      <section className="mt-8">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-4 h-9 w-28 rounded-[4px]" />
      </section>

      <section className="mt-14">
        <Skeleton className="h-3 w-28" />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </section>
    </main>
  );
}
