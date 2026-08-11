import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostCategories, getPublishedPostSummaries } from "@/db/queries";
import { WritingIndexRow } from "@/components/portfolio/writing-index-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Notes, articles and what I am learning while building — by Aliameen Kareem.",
  alternates: { canonical: "/writing" },
};

export default async function WritingPage() {
  const [summaries, categories] = await Promise.all([
    getPublishedPostSummaries(),
    getPostCategories(),
  ]);

  // Grouped in the order the owner arranged the categories, with anything
  // uncategorised last. A category with nothing published renders nothing at
  // all, so the page never shows an empty heading while the archive is young.
  const groups = [
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      posts: summaries.filter((post) => post.categoryId === category.id),
    })),
    {
      id: "uncategorised",
      name: "Other",
      posts: summaries.filter(
        (post) =>
          !post.categoryId ||
          !categories.some((category) => category.id === post.categoryId),
      ),
    },
  ].filter((group) => group.posts.length > 0);

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

      {groups.length ? (
        <div className="mt-10 flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <h2
                id={`group-${group.id}`}
                className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground"
              >
                {group.name}
              </h2>
              <ul className="flex flex-col">
                {group.posts.map((post) => (
                  <li key={post.id}>
                    <WritingIndexRow post={post} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm leading-6 text-muted-foreground">
          Nothing published yet. Notes on what I am learning and building are on
          the way.
        </p>
      )}
    </main>
  );
}
