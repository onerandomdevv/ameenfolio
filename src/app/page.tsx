import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { after } from "next/server";
import { getPublicPortfolio } from "@/db/queries";
import { NowSection } from "@/components/portfolio/now-section";
import { StatsStrip } from "@/components/portfolio/stats-strip";
import { PortfolioNav } from "@/components/portfolio/portfolio-nav";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ProjectRow } from "@/components/portfolio/project-row";
import { ResumeDownloadButton } from "@/components/portfolio/resume-download-button";
import { SendMessageDialog } from "@/components/portfolio/send-message-dialog";
import { ProjectsEmptyState } from "@/components/portfolio/projects-empty-state";
import { RecognitionRow } from "@/components/portfolio/recognition-row";
import { RecognitionsEmptyState } from "@/components/portfolio/recognitions-empty-state";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { TechStackSection } from "@/components/portfolio/tech-stack-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { BriefcaseGlyph, MailGlyph } from "@/components/icons/glyph-icons";
import { availabilityLabel } from "@/config/availability";
import { portfolioIdentity } from "@/config/portfolio";
import { instrumentSerif } from "@/app/fonts";
import { splitEmphasis } from "@/lib/text-emphasis";
import { splitHomepageProjects } from "@/lib/ordering";
import {
  canFetchGithubStats,
  isSnapshotStale,
  refreshStatsSnapshot,
} from "@/lib/stats/snapshot";

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
  const {
    settings,
    now,
    projects,
    recognitions,
    techStack,
    publishedProjectCount,
    statsSnapshot,
  } = await getPublicPortfolio();

  const { cards: homepageCards, rows: homepageRows } =
    splitHomepageProjects(projects);

  // Refreshed after the response is flushed rather than before it, so a slow
  // or unreachable GitHub delays nobody's page load. Whoever asks next gets
  // the newer numbers; this visitor still sees the strip immediately.
  if (canFetchGithubStats() && isSnapshotStale(statsSnapshot)) {
    after(refreshStatsSnapshot);
  }

  const profileImageBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const contactLinks = settings.contactLinks ?? {};
  const profileImageSrc = settings.profileImageKey
    ? profileImageBase
      ? `${profileImageBase}/${settings.profileImageKey}`
      : `/media/${settings.profileImageKey}`
    : undefined;
  const initials = portfolioIdentity.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const contactItems = [
    {
      label: "GitHub",
      href: contactLinks.github,
      icon: GitHubIcon,
      external: true,
      isStatic: false,
    },
    {
      label: "X",
      href: contactLinks.x,
      icon: XIcon,
      external: true,
      isStatic: false,
    },
    {
      label: "Mail",
      href: `mailto:${settings.email}`,
      icon: MailGlyph,
      external: false,
      isStatic: false,
    },
    // Hardcoded rather than a setting: where I am is not something that needs
    // editing from the admin. isStatic marks it as information rather than a
    // link whose URL happens to be missing, which is what the other items mean
    // when they have no href — the two render alike but must not sound alike.
    {
      label: "Lagos, Nigeria",
      href: undefined,
      icon: GlobeIcon,
      external: false,
      isStatic: true,
    },
  ];
  const footerSocialItems = [
    {
      label: "Instagram",
      href: contactLinks.instagram,
      icon: InstagramIcon,
    },
    {
      label: "LinkedIn",
      href: contactLinks.linkedin,
      icon: LinkedInIcon,
    },
    {
      label: "YouTube",
      href: contactLinks.youtube,
      icon: YouTubeIcon,
    },
    {
      label: "TikTok",
      href: contactLinks.tiktok,
      icon: TikTokIcon,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
      <PortfolioNav current="home" />

      <section className="mt-10 max-w-xl">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar className="size-24 rounded-[22%] border sm:size-28">
            {profileImageSrc ? (
              <AvatarImage
                src={profileImageSrc}
                alt={`${portfolioIdentity.name} profile photo`}
                className="rounded-[22%] object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-[22%] text-base font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-center sm:min-h-28">
            <h1
              className={`${instrumentSerif.className} text-[clamp(2.25rem,8vw,3.25rem)] leading-[0.95] tracking-[-0.02em] text-foreground`}
            >
              {portfolioIdentity.name}
            </h1>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {portfolioIdentity.role}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BriefcaseGlyph className="size-3.5" aria-hidden="true" />
              {availabilityLabel(settings.availability)}
            </p>
          </div>
        </div>
        <p className="mt-8 max-w-xl whitespace-pre-line text-pretty text-base leading-7 text-foreground/90">
          {splitEmphasis(
            portfolioIdentity.introduction,
            portfolioIdentity.introductionEmphasis,
          ).map((segment, index) =>
            segment.emphasized ? (
              <strong
                key={index}
                className="font-bold text-foreground underline decoration-1 underline-offset-4"
              >
                {segment.text}
              </strong>
            ) : (
              <Fragment key={index}>{segment.text}</Fragment>
            ),
          )}
        </p>
        <nav className="mt-3" aria-label="Contact links and location">
          <ul className="flex flex-wrap gap-x-5 gap-y-3">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary focus-visible:text-primary"
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      data-bippy-reaction={
                        item.label === "GitHub" ? "working" : "curious"
                      }
                      data-bippy-safe-zone
                    >
                      <Icon
                        className="size-4 text-foreground"
                        aria-hidden="true"
                      />
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
                      aria-disabled={item.isStatic ? undefined : true}
                    >
                      <Icon
                        className="size-4 text-foreground"
                        aria-hidden="true"
                      />
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      {/* Always rendered. The layout is part of the page rather than something
          that appears once a fetch succeeds, so the strip holds its place and
          the cells fill in as their data becomes available. */}
      <StatsStrip
        snapshot={statsSnapshot}
        hackathonWins={settings.hackathonWins}
        publishedProjectCount={publishedProjectCount}
      />

      <NowSection section={now} />

      <section
        className="mt-14"
        aria-labelledby="projects-heading"
        data-bippy-section="projects"
      >
        <SectionHeading id="projects-heading" title="Recent Projects" />
        {projects.length ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {homepageCards.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            {/* Everything past the eighth continues as a divided list rather
                than more cards, so the section can hold twelve projects
                without the grid dominating the page. */}
            {homepageRows.length ? (
              <div className="mt-6 divide-y divide-solid divide-border">
                {homepageRows.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            ) : null}
            {/* Reads as the last line of the list rather than a control beside
                the heading: the archive is where the section continues, so the
                invitation belongs at the point the visitor runs out of
                projects. */}
            <Link
              href="/projects"
              data-bippy-reaction="curious"
              data-bippy-safe-zone
              className="mt-4 inline-block text-[13px] text-muted-foreground underline decoration-border underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground focus-visible:text-foreground"
            >
              View all projects →
            </Link>
          </>
        ) : (
          <ProjectsEmptyState description="Fresh projects will be published here soon." />
        )}
      </section>

      <section
        className="mt-24"
        aria-labelledby="recognitions-heading"
        data-bippy-section="recognitions"
      >
        <SectionHeading id="recognitions-heading" title="Recognitions" />
        {recognitions.length ? (
          <ul className="mt-5 divide-y divide-solid divide-border">
            {recognitions.map((recognition) => (
              <li key={recognition.id}>
                <RecognitionRow
                  title={recognition.title}
                  iconName={recognition.iconName}
                  verificationUrl={recognition.verificationUrl}
                />
              </li>
            ))}
          </ul>
        ) : (
          <RecognitionsEmptyState>
            Recognition entries will appear here once published.
          </RecognitionsEmptyState>
        )}
      </section>

      <TechStackSection items={techStack} />

      {/* The page closes on an invitation rather than trailing off after the
          tech stack. The résumé lives here now: it was tucked against the
          footer rule as a lone right-aligned link, which read as fine print
          rather than as one of two ways to start a conversation. */}
      <section
        id="contact"
        className="mt-20 text-center"
        aria-labelledby="contact-heading"
      >
        <h2
          id="contact-heading"
          className="text-base leading-7 text-foreground/90"
        >
          Open to a nice conversation.
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5">
          <SendMessageDialog
            email={settings.email}
            whatsappUrl={contactLinks.whatsapp}
          />
          <span
            aria-hidden="true"
            className="h-4 w-px shrink-0 bg-border max-sm:hidden"
          />
          <ResumeDownloadButton
            hasResume={Boolean(settings.resumeKey)}
            filename={settings.resumeFilename}
          />
        </div>
      </section>

      <footer className="mt-8 font-mono text-xs text-muted-foreground">
        <Separator />
        <div className="mt-8 flex items-center justify-between gap-4">
          <p
            className={`${instrumentSerif.className} text-lg font-bold text-foreground`}
          >
            © {new Date().getFullYear()} onerandomdevv
          </p>
          <nav aria-label="Footer social links">
            <ul className="flex items-center">
              {footerSocialItems.map((item) => {
                const Icon = item.icon;
                const className =
                  "inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary";

                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        data-bippy-reaction="curious"
                        data-bippy-safe-zone
                        className={className}
                      >
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </a>
                    ) : (
                      <span
                        role="img"
                        aria-label={item.label}
                        className="inline-flex size-9 items-center justify-center text-muted-foreground opacity-50"
                      >
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </footer>
    </main>
  );
}
