import { notFound } from "next/navigation";
import { getAdminProject } from "@/db/queries";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();

  return <ProjectForm project={project} />;
}
