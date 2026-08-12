"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Globe, PencilLine, Pin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Live and drafts are separate views rather than one list with badges: you are
// either checking what is on the site or working on what is not.
//
// The choice lives in the URL so it survives a refresh, a pin, and the back
// button — all of which a piece of component state would lose.
const options = [
  { value: "live", label: "Live", icon: Globe },
  { value: "draft", label: "Drafts", icon: PencilLine },
] as const;

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

  const counts = { live, draft: drafts };
  const current = options.find((option) => option.value === showing)!;
  const CurrentIcon = current.icon;

  return (
    // A mark and a chevron, not a pair of labelled buttons: the row it sits in
    // also carries a pin count and a New button, and two words of chrome were
    // the first thing to wrap on a phone. The name is still spoken, and the
    // menu spells both views out.
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Showing ${current.label}. Change view`}
        title={`Showing ${current.label}`}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CurrentIcon className="size-4" aria-hidden="true" />
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="admin-theme w-[160px]">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => select(option.value)}
              className={cn(
                "gap-2.5 text-[13px]",
                option.value === showing
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden="true" />
              {option.label}
              <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                {counts[option.value]}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sits beside the view picker rather than under the list: how many pins are
// left is something you want to know before you scroll, not after.
export function PinCount({ used, max }: { used: number; max: number }) {
  return (
    <span
      title={`${used} of ${max} pinned to the homepage`}
      className="inline-flex h-8 items-center gap-1.5 px-1 font-mono text-[11.5px] tabular-nums text-muted-foreground"
    >
      <Pin className="size-3.5" aria-hidden="true" />
      <span>
        {used}/{max}
      </span>
      <span className="sr-only">pinned to the homepage</span>
    </span>
  );
}
