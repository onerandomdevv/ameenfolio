import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
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

  return <RecognitionForm recognition={rows[0]} />;
}
