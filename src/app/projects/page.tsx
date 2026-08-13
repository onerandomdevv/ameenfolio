import type { Metadata } from "next";
import { getAllPublishedProjects, getPublicBippyEnabled } from "@/db/queries";
import { BippyCompanion } from "@/components/bippy/bippy-companion";
import { PortfolioNav } from "@/components/portfolio/portfolio-nav";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ProjectsEmptyState } from "@/components/portfolio/projects-empty-state";
import { WakaTimeActivityStrip } from "@/components/portfolio/wakatime-activity-strip";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A complete archive of software products and experiments built by Ameen.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const [projects, bippyEnabled] = await Promise.all([
    getAllPublishedProjects(),
    getPublicBippyEnabled(),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <PortfolioNav current="projects" />

      <WakaTimeActivityStrip />
      <header className="mt-7">
        <p className="mx-auto max-w-xl text-center text-sm font-semibold leading-6 text-foreground">
          Record of products I have built and made contributions to.
        </p>
      </header>
      {projects.length ? (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectsEmptyState description="The complete project archive will appear here as work is published." />
      )}

      {/* See the note on the homepage: mounted per page, because the root
          layout also wraps the admin. */}
      <BippyCompanion enabled={bippyEnabled} />
    </main>
  );
}
