import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The whole admin is built from four shapes: a page header, a section heading,
// a field row, and a list row. Keeping them here rather than per screen is what
// stops the eight pages drifting apart again.

// No sub-heading by design. A sentence under every title explained things the
// screen already shows, and on a phone it wrapped to three lines above the
// content. Anything genuinely worth saying belongs next to the control it is
// about — a field note, or the line under a list.
export function AdminPage({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="min-w-0 text-[19px] font-semibold tracking-[-0.015em]">
          {title}
        </h1>
        {actions ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>
      {children}
    </>
  );
}

export function SectionHeading({
  children,
  meta,
  action,
  className,
}: {
  children: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-1 flex items-center gap-2.5", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {children}
      </span>
      {meta ? (
        <span className="text-[11.5px] text-muted-foreground">{meta}</span>
      ) : null}
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

// A field is a label, a value, and an optional note — sitting on the row's own
// rule rather than inside a box. A form then reads as a list of facts.
export function FieldRow({
  label,
  note,
  align = "center",
  children,
}: {
  label: ReactNode;
  note?: ReactNode;
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-1 border-b border-border/60 py-2.5 transition-colors hover:border-border",
        // minmax(0,1fr) rather than grid-cols-1: a bare `1fr` track keeps an
        // `auto` minimum, so a wide intrinsic child — a file input is the
        // usual culprit — pushes the track past the container.
        "grid-cols-[minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)_auto]",
        align === "start" ? "sm:items-start" : "sm:items-center",
      )}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="min-w-0 text-[13px]">{children}</div>
      {note ? (
        <span className="text-[11.5px] text-muted-foreground max-sm:order-3 sm:text-right">
          {note}
        </span>
      ) : null}
    </div>
  );
}

export function FieldNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
      {children}
    </p>
  );
}

// A divided list, not a card: the rule between two rows is all the structure a
// list of projects or posts needs.
export function ListRow({
  icon,
  title,
  titleMeta,
  meta,
  badge,
  actions,
}: {
  icon?: ReactNode;
  title: ReactNode;
  titleMeta?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 py-3">
      {/* The mark itself, with no tile behind it. A box would make a GitHub
          glyph and an uploaded logo look like the same kind of thing. */}
      {icon ? (
        <span className="grid size-5 shrink-0 place-items-center">{icon}</span>
      ) : null}
      <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-medium">
          {title}
          {titleMeta}
        </p>
        {meta}
      </div>
      {badge}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function RowMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-y border-border/60 py-10 text-center">
      <p className="text-[13.5px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}
