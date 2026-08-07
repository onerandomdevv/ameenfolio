import { notFound } from "next/navigation";
import { getAdminProject } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const project = await getAdminProject(id); if (!project) notFound(); return <><AdminPageHeader title={`Edit ${project.title}`} description="Update content, publishing, and homepage placement." /><ProjectForm project={project} /></>; }
