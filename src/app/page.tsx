import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, Mail } from "lucide-react";
import { getPublicPortfolio } from "@/db/queries";
import { ProjectCard } from "@/components/portfolio/project-card";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicPortfolio();
  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      url: "/",
      type: "website",
    },
  };
}

export default async function HomePage() {
  const { settings, projects, recognitions, technologies } =
    await getPublicPortfolio();
  const groupedTechnologies = Object.groupBy(
    technologies,
    (technology) => technology.category,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-10 pt-20 sm:px-6 sm:pt-28">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-accent-lime">
          Available for thoughtful work
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.07em] sm:text-7xl">
          {settings.name}
        </h1>
        <p className="mt-3 text-lg font-semibold text-white sm:text-xl">
          {settings.role}
        </p>
        <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          {settings.introduction}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {settings.socialLinks.map((link) => (
            <Button asChild variant="outline" key={link.url} className="min-h-11 border-white/15 bg-black/40">
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </Button>
          ))}
          <Button asChild className="min-h-11 bg-accent-lime font-bold text-black hover:bg-white">
            <a href={`mailto:${settings.email}`}>
              <Mail aria-hidden="true" className="size-4" />
              Contact me
            </a>
          </Button>
        </div>
      </section>

      <section className="mt-28" aria-labelledby="projects-heading">
        <SectionHeading id="projects-heading" eyebrow="Selected work" title="Recent projects" />
        {projects.length ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        ) : (
          <EmptyState>Fresh projects will be published here soon.</EmptyState>
        )}
        <div className="mt-7 text-center">
          <Link className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-accent-lime hover:text-white" href="/projects">
            View all projects <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-28" aria-labelledby="recognitions-heading">
        <SectionHeading id="recognitions-heading" eyebrow="Proof of work" title="Recognitions" />
        {recognitions.length ? (
          <div className="mt-8 grid gap-3">
            {recognitions.map((recognition) => (
              <article key={recognition.id} className="glass flex items-start gap-4 rounded-2xl p-5 text-left">
                <AssetIcon objectKey={recognition.iconKey} alt={recognition.iconAlt ?? ""} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold text-white">{recognition.title}</h3>
                    {recognition.recognizedOn ? <time className="font-mono text-xs text-text-muted">{recognition.recognizedOn}</time> : null}
                  </div>
                  <p className="mt-1 text-sm font-medium text-accent-lime">{recognition.issuer}</p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{recognition.description}</p>
                  {recognition.verificationUrl ? (
                    <a className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-white hover:text-accent-lime" href={recognition.verificationUrl} target="_blank" rel="noreferrer">
                      Verify <ArrowUpRight aria-hidden="true" className="size-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState>Recognition entries will appear here once published.</EmptyState>}
      </section>

      <section className="mt-28" aria-labelledby="stack-heading">
        <SectionHeading id="stack-heading" eyebrow="How I build" title="Tech stack" />
        {technologies.length ? (
          <div className="mt-8 grid gap-8">
            {Object.entries(groupedTechnologies).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-center font-mono text-xs font-bold uppercase tracking-[0.2em] text-text-muted">{category}</h3>
                <ul className="mt-4 flex flex-wrap justify-center gap-3">
                  {items?.map((technology) => (
                    <li key={technology.id}>
                      {technology.websiteUrl ? (
                        <a className="glass flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold hover:border-accent-lime/40" href={technology.websiteUrl} target="_blank" rel="noreferrer">
                          <AssetIcon objectKey={technology.iconKey} alt={technology.iconAlt ?? ""} size="sm" /> {technology.name}
                        </a>
                      ) : (
                        <span className="glass flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">
                          <AssetIcon objectKey={technology.iconKey} alt={technology.iconAlt ?? ""} size="sm" /> {technology.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <EmptyState>The stack list will be published from the admin.</EmptyState>}
      </section>

      <section className="mx-auto mt-28 max-w-xl text-center" aria-labelledby="resume-heading">
        <SectionHeading id="resume-heading" eyebrow="Want the full story?" title="Let’s work together" />
        <p className="mt-5 leading-7 text-text-secondary">Download my résumé or send an email to start a conversation.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {settings.resumeKey ? (
            <Button asChild className="min-h-11 bg-accent-lime font-bold text-black hover:bg-white">
              <a href="/resume"><Download aria-hidden="true" className="size-4" /> Download résumé</a>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="min-h-11 border-white/15 bg-black/40">
            <a href={`mailto:${settings.email}`}><Mail aria-hidden="true" className="size-4" /> Email me</a>
          </Button>
        </div>
      </section>

      <footer className="mt-24 border-t border-white/10 py-8 text-center font-mono text-xs text-text-muted">
        © {new Date().getFullYear()} {settings.name}. Built with intention.
      </footer>
    </main>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="mt-8 rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-text-muted">{children}</p>;
}
