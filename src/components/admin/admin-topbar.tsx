"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react";
import {
  adminSections,
  isCurrentSection,
  mediaUrl,
  publicSiteHref,
} from "@/components/admin/admin-sections";
import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

// Below lg there is no room for a rail beside the content, so navigation
// becomes one bar: who you are, where you are, and a way to go elsewhere.
export function AdminTopbar({
  profileImageKey,
}: {
  profileImageKey?: string | null;
}) {
  const pathname = usePathname();
  const base = useAdminBase();

  const isCurrent = (href: string) => isCurrentSection(pathname, base, href);
  const current =
    adminSections.find((section) => isCurrent(section.href)) ??
    adminSections[0];

  return (
    <header className="sticky top-0 z-30 flex h-[54px] items-center gap-2 border-b border-border bg-background px-3 lg:hidden">
      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md bg-accent font-mono text-[10px] text-muted-foreground">
        {profileImageKey ? (
          <Image
            src={mediaUrl(profileImageKey)}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          "A"
        )}
      </span>

      <span className="shrink-0 font-mono text-[11px] tracking-[0.12em]">
        AMEEN
      </span>
      <span aria-hidden="true" className="text-muted-foreground/40">
        /
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger className="group flex min-w-0 items-center gap-1 rounded-md text-[13.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="truncate">{current.label}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
          />
        </DropdownMenuTrigger>
        {/* The menu portals to the body, which sits outside the .admin-theme
            wrapper — without the class it would be painted in the public
            site's palette instead of the admin's. */}
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="admin-theme w-[210px]"
        >
          {adminSections.map((section) => {
            const Icon = section.icon;
            const currentPage = isCurrent(section.href);

            return (
              <DropdownMenuItem
                key={section.href}
                asChild
                // The same treatment the desktop rail gives the open section,
                // so the two navigations agree about where you are.
                className={cn(
                  "gap-2.5 py-2 text-[13.5px] text-muted-foreground",
                  currentPage && "bg-accent text-foreground",
                )}
              >
                <Link href={`${base}${section.href}`}>
                  <Icon aria-hidden="true" />
                  {section.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <a
        href={publicSiteHref}
        target="_blank"
        rel="noreferrer"
        aria-label="View site"
        title="View site"
        className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <SquareArrowOutUpRight className="size-4" aria-hidden="true" />
      </a>
      <SignOutButton compact />
    </header>
  );
}
