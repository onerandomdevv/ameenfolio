import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllPublishedProjects } from "@/db/queries";
import { PortfolioEmptyState } from "@/components/portfolio/empty-state";
import { ProjectCard } from "@/components/portfolio/project-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A complete archive of software products and experiments built by Ameen.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getAllPublishedProjects();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-20 pt-16 sm:px-6 sm:pt-24">
      <Button asChild variant="ghost">
        <Link href="/">
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          Back home
        </Link>
      </Button>
      <header className="mt-10 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">
          The archive
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl">
          All projects
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">
          A focused record of products I have designed, engineered, and helped
          bring to life.
        </p>
      </header>
      {projects.length ? (
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <PortfolioEmptyState>No published projects yet.</PortfolioEmptyState>
      )}
    </main>
  );
}
