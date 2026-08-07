import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/db/schema";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card
      role="article"
      className="h-full gap-0 py-5 text-left transition-colors sm:py-6"
    >
      <CardHeader className="grid-cols-[1fr_auto] px-5 sm:px-6">
        <AssetIcon objectKey={project.iconKey} alt={project.iconAlt ?? ""} />
        {project.statusLabel ? (
          <CardAction>
            <Badge variant="outline">{project.statusLabel}</Badge>
          </CardAction>
        ) : null}
        <CardTitle className="col-span-2 mt-3">
          <h3 className="text-xl font-black uppercase tracking-tight">
            {project.title}
          </h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 pt-3 sm:px-6">
        <p className="text-sm leading-6 text-muted-foreground">
          {project.shortDescription}
        </p>
        {project.contribution ? (
          <p className="border-l-2 border-primary/60 pl-3 text-sm leading-6 text-foreground/80">
            {project.contribution}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap gap-2 px-5 pt-6 sm:px-6">
        <Button asChild>
          <a href={project.liveUrl} target="_blank" rel="noreferrer">
            View live
            <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          </a>
        </Button>
        {project.githubUrl ? (
          <Button asChild variant="outline">
            <a href={project.githubUrl} target="_blank" rel="noreferrer">
              <Github aria-hidden="true" data-icon="inline-start" />
              Source
            </a>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
