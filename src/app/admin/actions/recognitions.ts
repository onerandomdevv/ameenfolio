"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { recognitionImages, recognitions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import {
  recognitionFormSchema,
  type RecognitionFormInput,
} from "@/lib/validation";

export async function saveRecognition(
  input: RecognitionFormInput,
  id?: string,
  publish?: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = recognitionFormSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Pulled out of the column values: images live in their own table, and
  // `undefined` here means the caller said nothing about them, which is not the
  // same as saying there are none. See the note on the schema field.
  const { images, ...fields } = parsed.data;
  const values = {
    ...fields,
    verificationUrl: fields.verificationUrl || null,
    articlePostId: fields.articlePostId || null,
    ...(publish === undefined ? {} : { published: publish }),
  };

  try {
    const db = getDb();
    const rows = id
      ? await db
          .update(recognitions)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(recognitions.id, id))
          .returning({ id: recognitions.id })
      : await db
          .insert(recognitions)
          .values(values)
          .returning({ id: recognitions.id });
    if (!rows[0]) return { ok: false, message: "Recognition not found." };
    const recognitionId = rows[0].id;

    if (images) {
      // Batched rather than issued one after another: db.transaction() throws
      // on the neon-http driver, but a batch is sent as a single transaction,
      // so a failure part way through cannot leave the recognition saved with
      // its images already deleted while the caller is told the save failed.
      const imageRows = images.map((image) => ({ ...image, recognitionId }));
      const clearImages = db
        .delete(recognitionImages)
        .where(eq(recognitionImages.recognitionId, recognitionId));
      // Two literal batches rather than one spread array: batch takes a
      // non-empty tuple, and a conditional spread widens it to a plain array
      // that no longer satisfies that.
      await (imageRows.length
        ? db.batch([
            clearImages,
            db.insert(recognitionImages).values(imageRows),
          ])
        : db.batch([clearImages]));
    }

    refreshPublicContent();
    return { ok: true, id: recognitionId };
  } catch (error) {
    logServer("error", "crud.recognition_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The recognition could not be saved." };
  }
}

export async function deleteRecognition(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [deleted] = await getDb()
      .delete(recognitions)
      .where(eq(recognitions.id, id))
      .returning({ id: recognitions.id });
    if (!deleted) return { ok: false, message: "Recognition not found." };
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.recognition_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The recognition could not be deleted." };
  }
}
