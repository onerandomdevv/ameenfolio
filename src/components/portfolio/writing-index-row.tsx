import Link from "next/link";
import { formatPostMonth, toDateAttribute } from "@/lib/writing/format";
import type { PublishedPostSummary } from "@/db/queries";

// A leader row, the way a table of contents sets one: the dotted rule takes up
// whatever space the title leaves, so titles of any length still deliver the
// eye to a date column that stays put.
export function WritingIndexRow({ post }: { post: PublishedPostSummary }) {
  return (
    <Link
      href={`/writing/${post.slug}`}
      data-bippy-reaction="curious"
      data-bippy-safe-zone
      className="group flex items-baseline gap-2 py-1.5"
    >
      <span className="text-sm text-foreground transition-colors group-hover:text-muted-foreground">
        {post.title}
      </span>
      {/* Nudged up half a pixel: a border sits on the text baseline, and the
          dots read as underlining the title unless they drop below it. */}
      <span
        className="min-w-10 grow -translate-y-0.5 border-b border-dotted border-border"
        aria-hidden="true"
      />
      <time
        dateTime={toDateAttribute(post.publishedAt)}
        className="shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground"
      >
        {formatPostMonth(post.publishedAt)}
      </time>
    </Link>
  );
}
