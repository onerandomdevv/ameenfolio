"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/now", label: "Now" },
  { href: "/recognitions", label: "Recognitions" },
  { href: "/bippy", label: "Bippy" },
  { href: "/settings", label: "Settings" },
] as const;

// On an `admin.` host, `/` is rewritten to the admin projects page, so a
// relative root link sends "View site" back into the admin instead of the
// portfolio. The public origin has to be named rather than inferred from the
// current one. NEXT_PUBLIC_APP_URL already has to be the public site for
// canonical URLs and the sitemap, so it is the same fact, not new config.
const publicSiteHref = process.env.NEXT_PUBLIC_APP_URL || "/";

export function AdminNav() {
  const pathname = usePathname();
  const base = useAdminBase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </span>
          <div className="flex items-center gap-1">
            <a
              href={publicSiteHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              View site
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            <SignOutButton />
          </div>
        </div>

        {/* Scrolls rather than wraps on a narrow screen: five tabs plus the
            actions cannot fit at 360px, and a wrapped second row pushes the
            page content down on every view. */}
        <nav aria-label="Admin sections" className="-mx-5 sm:mx-0">
          <ul className="scrollbar-hide flex items-center gap-1 overflow-x-auto px-5 pb-2 sm:px-0">
            {links.map((link) => {
              const href = `${base}${link.href}`;
              const active =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li key={link.href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-sm transition-colors",
                      active
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
