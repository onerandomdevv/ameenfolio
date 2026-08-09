import { Skeleton } from "@/components/ui/skeleton";

// The archive has its own skeleton because its WakaTime activity strip and
// project grid differ from the homepage composition.
export default function ProjectsLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="flex justify-end">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-14 rounded-[3px]" />
        </div>
        <Skeleton className="mt-4 h-28 w-full rounded-sm" />
      </div>

      <header className="mt-7">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </header>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
