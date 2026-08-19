"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquareArrowOutUpRight } from "lucide-react";
import {
  adminSections,
  isCurrentSection,
  mediaUrl,
  publicSiteHref,
} from "@/components/admin/admin-sections";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  counts,
  profileImageKey,
}: {
  counts: Record<string, number>;
  profileImageKey?: string | null;
}) {
  const pathname = usePathname();
  const base = useAdminBase();

  return (
    // Desktop only. A narrow icon rail was still stealing width from a phone
    // and saying less than the top bar does, so below lg this is simply gone.
    // Fixed rather than sticky: the content column scrolls on its own, so the
    // navigation stays put however long a settings page gets.
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[216px] flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-[62px] shrink-0 items-center gap-2.5 px-4">
        {/* The photo is the identity here, so it carries the mark rather than
            a wordmark repeating the site's name. */}
        {/* Softened corners, not a circle — the same shape the photo has in
            the top bar and in settings, so it reads as one face throughout. */}
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-accent font-mono text-[11px] text-muted-foreground">
          {profileImageKey ? (
            <Image
              src={mediaUrl(profileImageKey)}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            "A"
          )}
        </span>
        <span className="truncate font-mono text-[12px] tracking-[0.14em]">
          AMEEN
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1.5" aria-label="Admin">
        <ul>
          {adminSections.map((link) => {
            const href = `${base}${link.href}`;
            const current = isCurrentSection(pathname, base, link.href);
            const Icon = link.icon;
            const count = counts[link.href];

            return (
              <li key={link.href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "mb-0.5 flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    current && "bg-accent text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{link.label}</span>
                  {typeof count === "number" ? (
                    <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border p-2">
        <a
          href={publicSiteHref}
          target="_blank"
          rel="noreferrer"
          className="mb-0.5 flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SquareArrowOutUpRight
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          <span>View site</span>
        </a>
        <SignOutButton />
      </div>
    </aside>
  );
}
