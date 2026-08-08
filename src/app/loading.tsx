import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 sm:pt-12">
      <div className="mx-auto grid max-w-xl justify-items-center gap-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="mt-28 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </main>
  );
}
