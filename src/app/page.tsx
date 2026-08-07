import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, Mail } from "lucide-react";
import { getPublicPortfolio } from "@/db/queries";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { PortfolioEmptyState } from "@/components/portfolio/empty-state";
import { ProjectCard } from "@/components/portfolio/project-card";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-primary">
          Available for thoughtful work
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.07em] sm:text-7xl">
          {settings.name}
        </h1>
        <p className="mt-3 text-lg font-semibold sm:text-xl">{settings.role}</p>
        <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {settings.introduction}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {settings.socialLinks.map((link) => (
            <Button asChild variant="outline" key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
                <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
              </a>
            </Button>
          ))}
          <Button asChild>
            <a href={`mailto:${settings.email}`}>
              <Mail aria-hidden="true" data-icon="inline-start" />
              Contact me
            </a>
          </Button>
        </div>
      </section>

      <section className="mt-28" aria-labelledby="projects-heading">
        <SectionHeading
          id="projects-heading"
          eyebrow="Selected work"
          title="Recent projects"
        />
        {projects.length ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <PortfolioEmptyState>
            Fresh projects will be published here soon.
          </PortfolioEmptyState>
        )}
        <div className="mt-7 text-center">
          <Button asChild variant="link">
            <Link href="/projects">
              View all projects
              <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-28" aria-labelledby="recognitions-heading">
        <SectionHeading
          id="recognitions-heading"
          eyebrow="Proof of work"
          title="Recognitions"
        />
        {recognitions.length ? (
          <div className="mt-8 grid gap-3">
            {recognitions.map((recognition) => (
              <Card key={recognition.id} role="article" className="gap-4">
                <CardHeader className="grid-cols-[auto_1fr]">
                  <AssetIcon
                    objectKey={recognition.iconKey}
                    alt={recognition.iconAlt ?? ""}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <CardTitle>
                        <h3>{recognition.title}</h3>
                      </CardTitle>
                      {recognition.recognizedOn ? (
                        <time className="font-mono text-xs text-muted-foreground">
                          {recognition.recognizedOn}
                        </time>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {recognition.issuer}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="sm:pl-[5.75rem]">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {recognition.description}
                  </p>
                  {recognition.verificationUrl ? (
                    <Button asChild variant="link" className="mt-2 px-0">
                      <a
                        href={recognition.verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Verify
                        <ArrowUpRight
                          aria-hidden="true"
                          data-icon="inline-end"
                        />
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <PortfolioEmptyState>
            Recognition entries will appear here once published.
          </PortfolioEmptyState>
        )}
      </section>

      <section className="mt-28" aria-labelledby="stack-heading">
        <SectionHeading
          id="stack-heading"
          eyebrow="How I build"
          title="Tech stack"
        />
        {technologies.length ? (
          <div className="mt-8 grid gap-8">
            {Object.entries(groupedTechnologies).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-center font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {category}
                </h3>
                <ul className="mt-4 flex flex-wrap justify-center gap-3">
                  {items?.map((technology) => (
                    <li key={technology.id}>
                      {technology.websiteUrl ? (
                        <Badge
                          asChild
                          variant="secondary"
                          className="min-h-11 px-4"
                        >
                          <a
                            href={technology.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <AssetIcon
                              objectKey={technology.iconKey}
                              alt={technology.iconAlt ?? ""}
                              size="sm"
                            />
                            {technology.name}
                          </a>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="min-h-11 px-4">
                          <AssetIcon
                            objectKey={technology.iconKey}
                            alt={technology.iconAlt ?? ""}
                            size="sm"
                          />
                          {technology.name}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <PortfolioEmptyState>
            The stack list will be published from the admin.
          </PortfolioEmptyState>
        )}
      </section>

      <section
        className="mx-auto mt-28 max-w-xl text-center"
        aria-labelledby="resume-heading"
      >
        <SectionHeading
          id="resume-heading"
          eyebrow="Want the full story?"
          title="Let’s work together"
        />
        <p className="mt-5 leading-7 text-muted-foreground">
          Download my résumé or send an email to start a conversation.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {settings.resumeKey ? (
            <Button asChild>
              <a href="/resume">
                <Download aria-hidden="true" data-icon="inline-start" />
                Download résumé
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <a href={`mailto:${settings.email}`}>
              <Mail aria-hidden="true" data-icon="inline-start" />
              Email me
            </a>
          </Button>
        </div>
      </section>

      <footer className="mt-24 text-center font-mono text-xs text-muted-foreground">
        <Separator className="mb-8" />© {new Date().getFullYear()}{" "}
        {settings.name}. Built with intention.
      </footer>
    </main>
  );
}
