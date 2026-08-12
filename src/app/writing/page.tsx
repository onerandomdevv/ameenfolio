import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedPostSummaries } from "@/db/queries";
import { WritingIndexRow } from "@/components/portfolio/writing-index-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Notes, articles and what I am learning while building — by Aliameen Kareem.",
  alternates: { canonical: "/writing" },
};

export default async function WritingPage() {
  const summaries = await getPublishedPostSummaries();

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

      {summaries.length ? (
        <ul className="mt-10 flex flex-col">
          {summaries.map((post) => (
            <li key={post.id}>
              <WritingIndexRow post={post} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-sm leading-6 text-muted-foreground">
          Nothing published yet. Notes on what I am learning and building are on
          the way.
        </p>
      )}
    </main>
  );
}
