import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noreferrer"
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full gap-0 py-5 text-left shadow-none transition-colors group-hover:border-foreground/30 group-hover:bg-accent/40 sm:py-6">
        <CardHeader className="grid-cols-[1fr_auto] px-5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle>
              <h3 className="text-base font-medium">{project.title}</h3>
            </CardTitle>
            {project.statusLabel ? (
              <Badge variant="outline">{project.statusLabel}</Badge>
            ) : null}
          </div>
          <CardAction className="text-muted-foreground transition-colors group-hover:text-primary">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-5 pt-3 sm:px-6">
          <p className="text-sm leading-6 text-muted-foreground">
            {project.shortDescription}
          </p>
          {project.contribution ? (
            <p className="mt-4 text-xs leading-5 text-foreground/70">
              {project.contribution}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </a>
  );
}
