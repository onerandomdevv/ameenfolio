import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminPosts, getPostCategories } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPostList } from "@/components/admin/post-list";
import { PostCategoriesManager } from "@/components/admin/post-categories-manager";
import { Button } from "@/components/ui/button";
import { adminBasePath } from "@/lib/admin-path";
import { MAX_PINNED_POSTS } from "@/lib/ordering";

export default async function AdminWritingPage() {
  const [posts, categories, base] = await Promise.all([
    getAdminPosts(),
    getPostCategories(),
    adminBasePath(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Writing"
        description={`Notes and articles. Pin up to ${MAX_PINNED_POSTS} to the homepage.`}
        action={
          <Button asChild size="sm">
            <Link href={`${base}/writing/new`}>
              <Plus data-icon="inline-start" />
              New post
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6">
        <AdminPostList posts={posts} categories={categories} base={base} />
        <PostCategoriesManager categories={categories} />
      </div>
    </>
  );
}
