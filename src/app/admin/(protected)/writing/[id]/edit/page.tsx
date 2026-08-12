import { notFound } from "next/navigation";
import { getAdminPost } from "@/db/queries";
import { PostForm } from "@/components/admin/post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const found = await getAdminPost(id);
  if (!found) notFound();

  return <PostForm post={found.post} links={found.links} />;
}
