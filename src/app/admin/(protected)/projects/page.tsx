import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProjects } from "@/db/queries";
import { AdminPage } from "@/components/admin/admin-primitives";
import { AdminProjectList } from "@/components/admin/project-list";
import { StatusFilter } from "@/components/admin/status-filter";
import { Button } from "@/components/ui/button";
import { adminBasePath } from "@/lib/admin-path";
import { MAX_PINNED_PROJECTS } from "@/lib/ordering";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [projects, base, params] = await Promise.all([
    getAdminProjects(),
    adminBasePath(),
    searchParams,
  ]);

  const showing = params.status === "draft" ? "draft" : "live";
  const live = projects.filter((project) => project.published);
  const drafts = projects.filter((project) => !project.published);
  const pinned = live.filter((project) => project.pinnedAt).length;

  return (
    <AdminPage
      title="Projects"
      description="Posting puts a project on the site. Pin one to show it on the homepage."
      actions={
        <>
          <StatusFilter live={live.length} drafts={drafts.length} />
          <Button asChild size="sm">
            <Link href={`${base}/projects/new`}>
              <Plus data-icon="inline-start" />
              New project
            </Link>
          </Button>
        </>
      }
    >
      <AdminProjectList
        projects={showing === "draft" ? drafts : live}
        all={live}
        base={base}
        showing={showing}
      />
      <p className="mt-3 text-[11.5px] leading-5 text-muted-foreground">
        {pinned} of {MAX_PINNED_PROJECTS} pinned. Pinned projects appear on the
        homepage newest first — the first 8 as cards, the rest as compact rows.
        Taking one down is a delete.
      </p>
    </AdminPage>
  );
}
