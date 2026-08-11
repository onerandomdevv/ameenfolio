import { getPostCategories } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";

export default async function NewPostPage() {
  const categories = await getPostCategories();

  return (
    <>
      <AdminPageHeader
        title="New post"
        description="Write in Markdown. Nothing appears on the site until it is published."
      />
      <PostForm categories={categories} />
    </>
  );
}
