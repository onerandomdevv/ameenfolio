"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Live and drafts are separate views rather than one list with badges: you are
// either checking what is on the site or working on what is not.
//
// The choice lives in the URL so it survives a refresh, a pin, and the back
// button — all of which a piece of component state would lose.
export function StatusFilter({
  live,
  drafts,
}: {
  live: number;
  drafts: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const showing = params.get("status") === "draft" ? "draft" : "live";

  function select(next: "live" | "draft") {
    const query = new URLSearchParams(params);
    if (next === "live") query.delete("status");
    else query.set("status", next);
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }

  const options = [
    { value: "live", label: "Live", count: live },
    { value: "draft", label: "Drafts", count: drafts },
  ] as const;

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={showing === option.value}
          onClick={() => select(option.value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 px-3 text-[12.5px] transition-colors",
            index > 0 && "border-l border-border",
            showing === option.value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {option.count}
          </span>
        </button>
      ))}
    </div>
  );
}
