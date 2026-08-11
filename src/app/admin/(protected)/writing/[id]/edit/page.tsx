import { notFound } from "next/navigation";
import { getAdminPost, getPostCategories } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [found, categories] = await Promise.all([
    getAdminPost(id),
    getPostCategories(),
  ]);
  if (!found) notFound();

  return (
    <>
      <AdminPageHeader title="Edit post" description={found.post.title} />
      <PostForm post={found.post} links={found.links} categories={categories} />
    </>
  );
}
