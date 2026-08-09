import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeadingProps = {
  id: string;
  title: string;
  action?: {
    href: string;
    label: string;
  };
};

export function SectionHeading({ id, title, action }: SectionHeadingProps) {
  return (
    <header className="flex items-center">
      <h2
        id={id}
        className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground"
      >
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          aria-label={action.label}
          data-bippy-reaction="curious"
          data-bippy-safe-zone
          className="-my-3.5 ml-1 inline-flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </header>
  );
}
