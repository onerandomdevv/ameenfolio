import Link from "next/link";
import { ExternalLink, Github, Plus } from "lucide-react";
import { getAdminProjects } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminProjectsPage() {
  const projects = await getAdminProjects();
  return <><AdminPageHeader title="Projects" description="Publish work and choose up to eight homepage highlights." action={<Button asChild className="bg-accent-lime text-black hover:bg-white"><Link href="/admin/projects/new"><Plus className="size-4" />New project</Link></Button>} />
  <div className="overflow-hidden rounded-xl border border-white/10"><Table><TableHeader><TableRow><TableHead>Project</TableHead><TableHead className="hidden sm:table-cell">Visibility</TableHead><TableHead className="hidden md:table-cell">Links</TableHead><TableHead className="w-24 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{projects.length ? projects.map((project) => <TableRow key={project.id}><TableCell><Link href={`/admin/projects/${project.id}/edit`} className="font-semibold hover:text-accent-lime">{project.title}</Link><div className="mt-2 flex flex-wrap gap-2 sm:hidden"><VisibilityBadges published={project.published} homepage={project.showOnHomepage} /></div></TableCell><TableCell className="hidden sm:table-cell"><div className="flex flex-wrap gap-2"><VisibilityBadges published={project.published} homepage={project.showOnHomepage} /></div></TableCell><TableCell className="hidden md:table-cell"><div className="flex gap-2"><a aria-label={`Open ${project.title}`} href={project.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a>{project.githubUrl ? <a aria-label={`Open ${project.title} repository`} href={project.githubUrl} target="_blank" rel="noreferrer"><Github className="size-4" /></a> : null}</div></TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="sm"><Link href={`/admin/projects/${project.id}/edit`}>Edit</Link></Button><DeleteProjectButton id={project.id} title={project.title} /></div></TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No projects yet.</TableCell></TableRow>}</TableBody></Table></div></>;
}

function VisibilityBadges({ published, homepage }: { published: boolean; homepage: boolean }) { return <>{<Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>}{homepage ? <Badge variant="outline">Homepage</Badge> : null}</>; }
