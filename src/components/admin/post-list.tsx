"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deletePost } from "@/app/admin/actions/writing";
import { EmptyState, ListRow } from "@/components/admin/admin-primitives";
import { PinButton, PinnedMark } from "@/components/admin/pin-button";
import { DeleteAction, EditAction } from "@/components/admin/row-actions";
import type { Post } from "@/db/schema";
import { pinRank } from "@/lib/ordering";
import { useAdminBase } from "@/lib/use-admin-base";
import { formatPostMonth } from "@/lib/writing/format";

export function AdminPostList({
  posts,
  all,
  showing,
}: {
  posts: Post[];
  all: Post[];
  showing: "live" | "draft";
}) {
  const base = useAdminBase();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!posts.length) {
    return (
      <EmptyState
        title={showing === "live" ? "Nothing published yet" : "No drafts"}
        description={
          showing === "live"
            ? "Posts you publish will appear here."
            : "Writing you save without publishing will appear here."
        }
      />
    );
  }

  function remove(post: Post) {
    startTransition(async () => {
      const result = await deletePost(post.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Post deleted." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="border-t border-border/60">
      {posts.map((post) => {
        const rank = pinRank(all, post);

        return (
          <ListRow
            key={post.id}
            title={post.title}
            titleMeta={rank ? <PinnedMark rank={rank} /> : null}
            meta={
              <>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  /writing/{post.slug}
                </p>
              </>
            }
            badge={
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {post.published
                  ? formatPostMonth(post.publishedAt)
                  : `Saved ${formatPostMonth(post.updatedAt)}`}
              </span>
            }
            actions={
              <>
                {post.published ? (
                  <PinButton
                    kind="post"
                    id={post.id}
                    pinned={Boolean(post.pinnedAt)}
                  />
                ) : null}
                <EditAction
                  href={`${base}/writing/${post.id}/edit`}
                  what={post.title}
                />
                <DeleteAction
                  what={post.title}
                  title="Delete this post?"
                  description={`“${post.title}” and its links will be removed. Any images it used stay in storage.`}
                  confirmLabel="Delete post"
                  pending={pending}
                  onConfirm={() => remove(post)}
                />
              </>
            }
          />
        );
      })}
    </div>
  );
}
