import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/db/schema";
import { AssetIcon } from "@/components/portfolio/asset-icon";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="glass flex h-full flex-col rounded-2xl p-5 text-left transition-colors hover:border-accent-lime/30 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <AssetIcon objectKey={project.iconKey} alt={project.iconAlt ?? ""} />
        {project.statusLabel ? <span className="rounded-full border border-accent-lime/25 bg-accent-lime/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-lime">{project.statusLabel}</span> : null}
      </div>
      <h3 className="mt-5 text-xl font-black uppercase tracking-tight text-white">{project.title}</h3>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{project.shortDescription}</p>
      {project.contribution ? <p className="mt-4 border-l-2 border-accent-lime/60 pl-3 text-sm leading-6 text-white/80">{project.contribution}</p> : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <a className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-lime px-4 text-sm font-bold text-black hover:bg-white" href={project.liveUrl} target="_blank" rel="noreferrer">View live <ArrowUpRight aria-hidden="true" className="size-4" /></a>
        {project.githubUrl ? <a className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-bold text-white hover:border-accent-lime/50" href={project.githubUrl} target="_blank" rel="noreferrer"><Github aria-hidden="true" className="size-4" /> Source</a> : null}
      </div>
    </article>
  );
}
