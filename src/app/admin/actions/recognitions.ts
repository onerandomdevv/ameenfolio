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
import { deleteObject } from "@/lib/storage/server";
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

    // Read before replacing, so the objects belonging to rows about to be
    // deleted can be removed from storage too. Projects, Now links and
    // settings all reconcile their images this way; recognitions were the
    // outlier because the set is a list rather than one key.
    const previousKeys = images
      ? (
          await db
            .select({ objectKey: recognitionImages.objectKey })
            .from(recognitionImages)
            .where(eq(recognitionImages.recognitionId, recognitionId))
        ).map((row) => row.objectKey)
      : [];

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

      // Only after the rows are committed: deleting first would leave the
      // recognition pointing at objects that no longer exist if the write then
      // failed. A failure here costs a stranded object, which is the cheaper
      // way round.
      const kept = new Set(images.map((image) => image.objectKey));
      await Promise.all(
        previousKeys
          .filter((key) => !kept.has(key))
          .map((key) => deleteObject(key)),
      );
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
    const db = getDb();
    // Read before the delete: the rows cascade with the recognition, taking
    // the only record of which objects were its own.
    const imageKeys = (
      await db
        .select({ objectKey: recognitionImages.objectKey })
        .from(recognitionImages)
        .where(eq(recognitionImages.recognitionId, id))
    ).map((row) => row.objectKey);

    const [deleted] = await db
      .delete(recognitions)
      .where(eq(recognitions.id, id))
      .returning({ id: recognitions.id });
    if (!deleted) return { ok: false, message: "Recognition not found." };
    refreshPublicContent();
    await Promise.all(imageKeys.map((key) => deleteObject(key)));
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.recognition_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The recognition could not be deleted." };
  }
}
