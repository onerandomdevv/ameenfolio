import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getAdminRecognitionImages, getPostOptions } from "@/db/queries";
import { recognitions } from "@/db/schema";
import { RecognitionForm } from "@/components/admin/recognition-form";

export default async function EditRecognitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await getDb()
    .select()
    .from(recognitions)
    .where(eq(recognitions.id, id))
    .limit(1);
  if (!rows[0]) notFound();

  const [images, postOptions] = await Promise.all([
    getAdminRecognitionImages(id),
    getPostOptions(),
  ]);

  return (
    <RecognitionForm
      recognition={rows[0]}
      // The column is nullable but the form field is optional, and zod rejects
      // an explicit null where it expects a missing value.
      images={images.map((image) => ({
        ...image,
        alt: image.alt ?? undefined,
      }))}
      postOptions={postOptions}
    />
  );
}
