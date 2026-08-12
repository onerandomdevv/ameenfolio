"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TechStackGroup = {
  value: string;
  label: string;
  items: { id: string; name: string }[];
};

/**
 * Two rows rather than two open lists.
 *
 * The stack had grown to the point where it was the tallest thing on the page,
 * which put the closing invitation below a wall of chips. As rows it reads like
 * the recognitions above it, and the full list is one tap away.
 *
 * Order comes from the admin's drag ordering — the query sorts by
 * `display_order`, and nothing here re-sorts it, so the modal shows exactly
 * what was arranged.
 */
export function TechStackGroups({ groups }: { groups: TechStackGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const active = groups.find((group) => group.value === open) ?? null;

  return (
    <>
      <ul className="mt-5 divide-y divide-solid divide-border">
        {groups.map((group) => (
          <li key={group.value}>
            <button
              type="button"
              onClick={() => setOpen(group.value)}
              data-bippy-reaction="curious"
              data-bippy-safe-zone
              className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:text-primary focus-visible:text-primary"
            >
              <span className="min-w-0 flex-1 text-sm leading-6">
                {group.label}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={Boolean(active)}
        onOpenChange={(next) => !next && setOpen(null)}
      >
        <DialogContent className="gap-0 p-5 sm:max-w-[420px]">
          <DialogHeader>
            {/* Named for screen readers only. The chips are the whole content,
                and a visible heading would repeat the row just tapped. */}
            <DialogTitle className="sr-only">
              {active?.label ?? "Tech stack"}
            </DialogTitle>
          </DialogHeader>
          {/* Clears the close button, which sits 16px from the top: without
              this the first row of chips runs under the X. */}
          <ul className="mt-4 flex flex-wrap gap-2">
            {active?.items.map((technology) => (
              <li key={technology.id}>
                <Badge
                  variant="secondary"
                  className="min-h-9 rounded-[4px] px-3"
                >
                  {technology.name}
                </Badge>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
