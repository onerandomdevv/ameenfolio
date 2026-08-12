import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminPosts } from "@/db/queries";
import { AdminPage } from "@/components/admin/admin-primitives";
import { AdminPostList } from "@/components/admin/post-list";
import { PinCount, StatusFilter } from "@/components/admin/status-filter";
import { Button } from "@/components/ui/button";
import { adminBasePath } from "@/lib/admin-path";
import { MAX_PINNED_POSTS } from "@/lib/ordering";

export default async function AdminWritingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [posts, base, params] = await Promise.all([
    getAdminPosts(),
    adminBasePath(),
    searchParams,
  ]);

  const showing = params.status === "draft" ? "draft" : "live";
  const live = posts.filter((post) => post.published);
  const drafts = posts.filter((post) => !post.published);
  const pinned = live.filter((post) => post.pinnedAt).length;

  return (
    <AdminPage
      title="Writing"
      actions={
        <>
          <PinCount used={pinned} max={MAX_PINNED_POSTS} />
          <StatusFilter live={live.length} drafts={drafts.length} />
          <Button asChild size="sm">
            <Link href={`${base}/writing/new`}>
              <Plus data-icon="inline-start" />
              <span className="max-sm:hidden">New post</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </>
      }
    >
      <AdminPostList
        posts={showing === "draft" ? drafts : live}
        all={live}
        showing={showing}
      />
    </AdminPage>
  );
}
