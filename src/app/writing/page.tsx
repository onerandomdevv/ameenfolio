import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getPublishedPostSummaries,
  getPublishedRecognitions,
} from "@/db/queries";
import { RecognitionRow } from "@/components/portfolio/recognition-row";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { WritingIndexRow } from "@/components/portfolio/writing-index-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Notes, articles and what I am learning while building — by Aliameen Kareem.",
  alternates: { canonical: "/writing" },
};

export default async function WritingPage() {
  const [summaries, recognitions] = await Promise.all([
    getPublishedPostSummaries(),
    getPublishedRecognitions(),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/"
        data-bippy-reaction="curious"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Go back
      </Link>

      <header className="mt-8">
        <h1 className="text-xl font-semibold text-foreground">Writing</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Notes, articles, and the things I learn while building.
        </p>
      </header>

      {/* Named, because the page holds two lists now. Without a heading the
          articles would read as the page and the recognitions as an appendix. */}
      <section className="mt-10" aria-labelledby="articles-heading">
        <SectionHeading id="articles-heading" title="Articles" />
        {summaries.length ? (
          <ul className="mt-5 flex flex-col">
            {summaries.map((post) => (
              <li key={post.id}>
                <WritingIndexRow post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Nothing published yet. Notes on what I am learning and building are
            on the way.
          </p>
        )}
      </section>

      {/* The full list. The homepage shows the pinned ones, so this is where a
          recognition goes on living once it is no longer one of the twelve.
          The id is what the homepage's "View more" lands on; scroll-mt keeps
          the heading clear of the viewport edge after the jump. */}
      <section
        id="recognitions"
        className="mt-16 scroll-mt-8"
        aria-labelledby="recognitions-heading"
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
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Recognition entries will appear here once published.
          </p>
        )}
      </section>
    </main>
  );
}
