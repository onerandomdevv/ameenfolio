import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the shape every admin screen shares: a header with a title, a
// description and an action, then a bordered panel of rows. The nav is not
// drawn here — it lives in the layout and is already on screen.
export default function AdminLoading() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="grid gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
