import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const slug = (value: string) =>
  `admin-section-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

// The panel the admin's forms sit in, matching the list pages.
//
// A labelled <section> rather than a <fieldset>: a fieldset would want its
// <legend> to carry the title, and a legend cannot also hold the header's
// action button without the group name swallowing it. aria-labelledby on the
// heading names the region once, and announces it once.
export function AdminSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = slug(title);

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-medium text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
