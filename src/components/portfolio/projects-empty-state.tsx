import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectsEmptyStateProps = {
  description: string;
};

export function ProjectsEmptyState({ description }: ProjectsEmptyStateProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card className="gap-0 border-dashed py-5 text-left shadow-none sm:py-6">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle>
            <h3 className="text-base font-medium text-muted-foreground">
              No projects published yet
            </h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-3 sm:px-6">
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
