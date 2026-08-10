import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/db/schema";

export function AdminProjectList({
  projects,
  base,
}: {
  projects: Project[];
  base: string;
}) {
  if (!projects.length) {
    return (
      <AdminEmptyState
        title="No projects yet"
        description="Add your first project to see it here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${base}/projects/${project.id}/edit`}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {project.title}
              </Link>
              {/* State as badges rather than a slash-separated sentence: on a
                  list you scan for the drafts, and a shape is faster to scan
                  than a phrase. */}
              <Badge variant={project.published ? "secondary" : "outline"}>
                {project.published ? "Published" : "Draft"}
              </Badge>
              {project.showOnHomepage ? (
                <Badge variant="outline">Homepage</Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {project.url}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <a href={project.url} target="_blank" rel="noreferrer">
                Open
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/projects/${project.id}/edit`}>Edit</Link>
            </Button>
            <DeleteProjectButton id={project.id} title={project.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}
