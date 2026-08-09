import Link from "next/link";
import { cn } from "@/lib/utils";

type PortfolioNavProps = {
  current: "home" | "projects";
};

const links = [
  { href: "/", label: "Home", id: "home" },
  { href: "/projects", label: "Projects", id: "projects" },
] as const;

export function PortfolioNav({ current }: PortfolioNavProps) {
  return (
    <nav
      className="flex justify-end"
      aria-label="Primary navigation"
      data-bippy-safe-zone
    >
      <ul className="flex items-center text-sm">
        {links.map((link, index) => (
          <li key={link.id} className="flex items-center">
            {index > 0 ? (
              <span
                className="mx-2 text-muted-foreground/50"
                aria-hidden="true"
              >
                /
              </span>
            ) : null}
            <Link
              href={link.href}
              aria-current={current === link.id ? "page" : undefined}
              data-bippy-reaction="curious"
              className={cn(
                "inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:text-primary",
                current === link.id
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
