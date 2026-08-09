import { Skeleton } from "@/components/ui/skeleton";

// The archive has its own skeleton because the root one mirrors the homepage,
// which opens with an avatar and a stats strip this page does not have.
export default function ProjectsLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="flex justify-end">
        <Skeleton className="h-4 w-32" />
      </div>

      <header className="mt-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-4 w-full" />
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
