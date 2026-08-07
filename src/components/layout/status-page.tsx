import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type StatusPageProps = {
  code: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: LucideIcon;
};

export function StatusPage({
  code,
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
}: StatusPageProps) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <Empty className="max-w-lg border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <p className="font-mono text-xs font-medium text-muted-foreground">
            {code}
          </p>
          <EmptyTitle>
            <h1 className="text-xl font-semibold">{title}</h1>
          </EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" className="hover:text-primary">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
