import Link from "next/link";
import { getAdminProjects } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import { adminBasePath } from "@/lib/admin-path";

export default async function AdminProjectsPage() {
  const projects = await getAdminProjects();
  const base = await adminBasePath();

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Publish work and choose up to eight homepage highlights."
        action={
          <Link
            href={`${base}/projects/new`}
            className="inline-flex min-h-11 items-center text-sm text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            New project
          </Link>
        }
      />

      {projects.length ? (
        <ul className="divide-y border-y">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <Link
                  href={`${base}/projects/${project.id}/edit`}
                  className="text-sm text-foreground transition-colors hover:text-muted-foreground"
                >
                  {project.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.published ? "Published" : "Draft"}
                  {project.showOnHomepage ? " / Homepage" : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  Live
                </a>
                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Code
                  </a>
                ) : null}
                <Link
                  href={`${base}/projects/${project.id}/edit`}
                  className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  Edit
                </Link>
                <DeleteProjectButton id={project.id} title={project.title} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y py-10 text-center text-sm text-muted-foreground">
          No projects yet.
        </p>
      )}
    </>
  );
}
