"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/app/admin/actions/writing";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post, PostCategory } from "@/db/schema";
import { formatPostMonth } from "@/lib/writing/format";
import { useAdminBase } from "@/lib/use-admin-base";

export function AdminPostList({
  posts,
  categories,
  base,
}: {
  posts: Post[];
  categories: PostCategory[];
  base: string;
}) {
  const [pending, startTransition] = useTransition();
  const adminBase = useAdminBase();
  const router = useRouter();
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  if (!posts.length) {
    return (
      <AdminEmptyState
        title="Nothing written yet"
        description="Your first post will appear here."
      />
    );
  }

  function remove(post: Post) {
    startTransition(async () => {
      const result = await deletePost(post.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Post deleted." : result.message,
      );
      // The action clears the public routes; this page is a separate route
      // and would otherwise keep showing the row that was just removed.
      if (result.ok) router.refresh();
    });
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${adminBase || base}/writing/${post.id}/edit`}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {post.title}
              </Link>
              <Badge variant={post.published ? "secondary" : "outline"}>
                {post.published ? "Published" : "Draft"}
              </Badge>
              {post.pinned ? <Badge variant="outline">Pinned</Badge> : null}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {formatPostMonth(post.publishedAt)}
              {post.categoryId && categoryNames.has(post.categoryId)
                ? ` · ${categoryNames.get(post.categoryId)}`
                : ""}
              {` · /writing/${post.slug}`}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {post.published ? (
              <Button asChild variant="ghost" size="sm">
                <a
                  href={`/writing/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={`Delete ${post.title}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {post.title} and its links will be removed. Any images it
                    used stay in storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove(post)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </li>
      ))}
    </ul>
  );
}
