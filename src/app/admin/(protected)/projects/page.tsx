import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProjects } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminProjectList } from "@/components/admin/project-list";
import { Button } from "@/components/ui/button";
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
          <Button asChild size="sm">
            <Link href={`${base}/projects/new`}>
              <Plus data-icon="inline-start" />
              New project
            </Link>
          </Button>
        }
      />
      <AdminProjectList projects={projects} base={base} />
    </>
  );
}
