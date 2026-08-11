import Link from "next/link";
import type { Post } from "@/db/schema";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { formatPostMonth, toDateAttribute } from "@/lib/writing/format";

// The homepage shows pinned posts rather than the newest, so a piece worth
// leading with stays there through a run of new writing.
export function WritingSection({ posts }: { posts: Post[] }) {
  return (
    <section
      className="mt-24"
      aria-labelledby="writing-heading"
      data-bippy-section="writing"
    >
      <SectionHeading id="writing-heading" title="Writing" />
      {posts.length ? (
        <div className="mt-5 divide-y divide-solid divide-border">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/writing/${post.slug}`}
              data-bippy-reaction="curious"
              data-bippy-safe-zone
              className="group flex items-baseline gap-3 rounded-md py-2.5"
            >
              <span className="min-w-0 text-sm font-medium text-foreground transition-colors group-hover:text-muted-foreground">
                {post.title}
              </span>
              {/* tabular-nums so the dates line up as a column rather than
                  shuffling with the width of each month's digits. */}
              <time
                dateTime={toDateAttribute(post.publishedAt)}
                className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
              >
                {formatPostMonth(post.publishedAt)}
              </time>
            </Link>
          ))}
        </div>
      ) : (
        // The section stays whether or not anything is published, the same way
        // the stats strip does: the shape of the page should not depend on how
        // much has been filled in yet.
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Notes on what I am learning and building are on the way.
        </p>
      )}
      <Link
        href="/writing"
        data-bippy-reaction="curious"
        data-bippy-safe-zone
        className="mt-4 inline-block text-[13px] text-muted-foreground underline decoration-border underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground focus-visible:text-foreground"
      >
        All writing →
      </Link>
    </section>
  );
}
