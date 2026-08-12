"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pin } from "lucide-react";
import { toast } from "sonner";
import { setPinned, type PlacementKind } from "@/app/admin/actions/placement";
import { cn } from "@/lib/utils";

// The button is the action — Pin or Unpin — while the row itself carries the
// state. Rank is never set here: pinning writes the current time, which is what
// puts it first.
export function PinButton({
  kind,
  id,
  pinned,
}: {
  kind: PlacementKind;
  id: string;
  pinned: boolean;
}) {
  const [busy, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      const result = await setPinned(kind, { id, pinned: !pinned });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(pinned ? "Unpinned." : "Pinned to the homepage.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={pinned}
      className={cn(
        "inline-flex h-[29px] items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-colors",
        pinned
          ? "border-accent-lime/35 bg-accent-lime/10 text-accent-lime"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        busy && "opacity-60",
      )}
    >
      {busy ? (
        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <Pin className="size-3" aria-hidden="true" />
      )}
      {pinned ? "Unpin" : "Pin"}
    </button>
  );
}

// Shown under the row it belongs to. Rank comes from the list's pin order, so
// it can never skip a number or repeat one.
export function PinnedMark({ rank }: { rank: number }) {
  return (
    <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px]">
      <Pin className="size-[11px]" aria-hidden="true" />
      Pinned · #{rank}
    </span>
  );
}
