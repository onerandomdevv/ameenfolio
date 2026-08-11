import { createElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedPost } from "@/db/queries";
import { getPostLinkIcon } from "@/config/post-link-icons";
import { formatPostDate, toDateAttribute } from "@/lib/writing/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublishedPost(slug);
  if (!found) return { title: "Writing" };

  return {
    title: found.post.title,
    alternates: { canonical: `/writing/${found.post.slug}` },
    openGraph: {
      title: found.post.title,
      url: `/writing/${found.post.slug}`,
      type: "article",
      publishedTime: found.post.publishedAt.toISOString(),
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const found = await getPublishedPost(slug);
  if (!found) notFound();

  const { post, links, category } = found;
  // Only the top level: a contents list that mirrors every subheading stops
  // being a summary of the piece.
  const contents = post.headings.filter((heading) => heading.level === 2);

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      {/* Sticky rather than scrolling away, and hidden below lg where there is
          no room for a second column. Absent entirely when the post has no
          sections to list. */}
      {contents.length ? (
        <nav
          aria-label="On this page"
          className="sticky top-12 hidden h-fit w-52 shrink-0 lg:block"
        >
          <p className="text-sm font-medium leading-snug text-foreground">
            {post.title}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {contents.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="text-[13px] leading-snug text-muted-foreground transition-colors hover:text-foreground"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <main className="min-w-0 max-w-xl flex-1">
        <Link
          href="/writing"
          data-bippy-reaction="curious"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Writing
        </Link>

        <header className="mt-8">
          <h1 className="text-balance text-xl font-semibold leading-snug text-foreground">
            {post.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={toDateAttribute(post.publishedAt)}>
              {formatPostDate(post.publishedAt)}
            </time>
            {category ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{category.name}</span>
              </>
            ) : null}
          </p>
        </header>

        {/* Sanitised when the post was saved, not when it is read — see
            lib/writing/markdown.ts. */}
        <article
          className="post-body mt-8"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />

        {links.length ? (
          <footer className="mt-12 border-t border-border pt-5">
            <ul className="flex flex-col gap-2">
              {links.map((link) => {
                const Icon = getPostLinkIcon(link.iconName);
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      data-bippy-reaction="curious"
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {/* createElement for the same reason as ProjectCard: a
                          capitalised render-scoped variable from a Map lookup
                          trips react-hooks/static-components. */}
                      {Icon
                        ? createElement(Icon, {
                            className: "size-4 shrink-0",
                            "aria-hidden": true,
                          })
                        : null}
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </footer>
        ) : null}
      </main>
    </div>
  );
}
