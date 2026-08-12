"use client";

import { Check, ChevronDown } from "lucide-react";
import { BriefcaseGlyph } from "@/components/icons/glyph-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { availabilityOptions, type Availability } from "@/config/availability";
import { cn } from "@/lib/utils";

/**
 * The same briefcase the homepage puts in front of this status, so the row is a
 * preview of the line it sets rather than an abstract choice.
 *
 * A lime dot used to stand in for it. Lime is the site's one accent and it was
 * being spent on a form field, and a coloured dot says "there are states" while
 * leaving you to learn which colour means what — the mark and the word together
 * say it outright.
 */
export function AvailabilityPicker({
  value,
  onChange,
}: {
  value: Availability;
  onChange: (next: Availability) => void;
}) {
  const current =
    availabilityOptions.find((option) => option.value === value) ??
    availabilityOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex h-8 items-center gap-2 rounded-lg px-1.5 text-[13px] outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <BriefcaseGlyph
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {current.label}
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="admin-theme w-[190px]">
        {availabilityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            className={cn(
              "gap-2.5 py-2 text-[13px]",
              option.value === value
                ? "bg-accent text-foreground"
                : "text-muted-foreground",
            )}
          >
            <BriefcaseGlyph className="size-3.5 shrink-0" aria-hidden="true" />
            {option.label}
            <Check
              aria-hidden="true"
              className={cn(
                "ml-auto size-3.5",
                option.value !== value && "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
