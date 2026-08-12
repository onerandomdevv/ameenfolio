"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Clock,
  Code2,
  FileText,
  Layers,
  Settings,
  SquareArrowOutUpRight,
  Trophy,
} from "lucide-react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

const links = [
  { href: "/projects", label: "Projects", icon: Layers },
  { href: "/writing", label: "Writing", icon: FileText },
  { href: "/now", label: "Now", icon: Clock },
  { href: "/recognitions", label: "Recognitions", icon: Trophy },
  { href: "/tech-stack", label: "Tech Stack", icon: Code2 },
  { href: "/bippy", label: "Bippy", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

// On an `admin.` host, `/` is rewritten to the admin, so a relative root link
// sends "View site" back into the admin instead of the portfolio. The public
// origin has to be named rather than inferred from the current one.
const publicSiteHref = process.env.NEXT_PUBLIC_APP_URL || "/";

export function AdminSidebar({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  const base = useAdminBase();

  return (
    // Fixed rather than sticky: the content column scrolls on its own, so the
    // navigation stays put however long a settings page gets.
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-[62px] flex-col border-r border-border bg-background",
        "lg:w-[216px]",
      )}
    >
      <div className="flex h-[62px] shrink-0 items-center justify-center px-4 lg:h-auto lg:justify-start lg:py-4">
        <div className="min-w-0 max-lg:hidden">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
          <p className="truncate text-sm font-semibold">Ameenfolio</p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-lg bg-accent font-mono text-[11px] lg:hidden"
        >
          AK
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1.5" aria-label="Admin">
        <ul>
          {links.map((link) => {
            const href = `${base}${link.href}`;
            // startsWith so a nested route — /writing/new, /projects/x/edit —
            // keeps its section marked rather than leaving nothing selected.
            const current =
              pathname === href || pathname.startsWith(`${href}/`);
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
                    "max-lg:justify-center max-lg:px-0",
                    current && "bg-accent text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="max-lg:sr-only">{link.label}</span>
                  {typeof count === "number" ? (
                    <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground max-lg:hidden">
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
          className="mb-0.5 flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground max-lg:justify-center max-lg:px-0"
        >
          <SquareArrowOutUpRight
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="max-lg:sr-only">View site</span>
        </a>
        <SignOutButton />
      </div>
    </aside>
  );
}
