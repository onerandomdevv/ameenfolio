"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/now", label: "Now" },
  { href: "/recognitions", label: "Recognitions" },
  { href: "/settings", label: "Settings" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const base = useAdminBase();

  return (
    <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <nav aria-label="Admin navigation">
        <ul className="flex flex-wrap items-center text-sm">
          {links.map((link, index) => {
            const href = `${base}${link.href}`;
            const active = pathname.startsWith(href);

            return (
              <li key={link.href} className="flex items-center">
                {index > 0 ? (
                  <span
                    className="mx-2 text-muted-foreground/50"
                    aria-hidden="true"
                  >
                    /
                  </span>
                ) : null}
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center transition-colors hover:text-foreground",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-4 text-sm">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          View site
        </a>
        <SignOutButton />
      </div>
    </header>
  );
}
