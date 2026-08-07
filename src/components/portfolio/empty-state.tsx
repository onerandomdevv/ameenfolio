import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";

export function PortfolioEmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Empty className="mt-8 border">
      <EmptyHeader>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
