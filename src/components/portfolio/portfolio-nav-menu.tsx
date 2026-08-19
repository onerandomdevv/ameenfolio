"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Writing and Recognitions live on one page, so putting both in the nav would
// spend two slots on one destination. A single control opens them instead, and
// the nav keeps reading as two words.
const destinations = [
  { href: "/writing", label: "Writing" },
  { href: "/writing#recognitions", label: "Recognitions" },
] as const;

export function PortfolioNavMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More pages"
        className="group inline-flex min-h-11 items-center rounded-md px-1 text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
      >
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={2}
        className="w-[150px] border-border bg-popover"
      >
        {destinations.map((item) => (
          <DropdownMenuItem key={item.label} asChild className="text-[13px]">
            <Link href={item.href} data-bippy-reaction="curious">
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
