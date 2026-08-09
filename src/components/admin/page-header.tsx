// Deliberately not the portfolio's Instrument Serif. A serif display face
// reads editorial, which is right for the public site and wrong for a tool —
// the heading here is a label on a control panel, not a masthead.
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
