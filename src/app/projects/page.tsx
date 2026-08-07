import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllPublishedProjects } from "@/db/queries";
import { ProjectCard } from "@/components/portfolio/project-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "A complete archive of software products and experiments built by Ameen.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getAllPublishedProjects();
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-20 pt-16 sm:px-6 sm:pt-24">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-text-secondary hover:text-accent-lime"><ArrowLeft aria-hidden="true" className="size-4" /> Back home</Link>
      <header className="mt-10 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent-lime">The archive</p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl">All projects</h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-text-secondary">A focused record of products I have designed, engineered, and helped bring to life.</p>
      </header>
      {projects.length ? <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <p className="mt-12 rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-text-muted">No published projects yet.</p>}
    </main>
  );
}
