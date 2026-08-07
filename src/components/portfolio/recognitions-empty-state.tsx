import { Trophy } from "lucide-react";

type RecognitionsEmptyStateProps = {
  children: React.ReactNode;
};

export function RecognitionsEmptyState({
  children,
}: RecognitionsEmptyStateProps) {
  return (
    <div className="mt-5">
      <div className="flex min-h-11 w-full items-start gap-3 py-3 text-left text-muted-foreground">
        <Trophy
          className="mt-1 size-4 shrink-0 text-muted-foreground/70"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 text-sm leading-6">{children}</p>
      </div>
    </div>
  );
}
