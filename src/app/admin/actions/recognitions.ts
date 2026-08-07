"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { recognitions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { recognitionSchema, type RecognitionInput } from "@/lib/validation";

export async function saveRecognition(
  input: RecognitionInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = recognitionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = {
    ...parsed.data,
    verificationUrl: parsed.data.verificationUrl || null,
  };

  try {
    const rows = id
      ? await getDb()
          .update(recognitions)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(recognitions.id, id))
          .returning({ id: recognitions.id })
      : await getDb()
          .insert(recognitions)
          .values(values)
          .returning({ id: recognitions.id });
    if (!rows[0]) return { ok: false, message: "Recognition not found." };
    refreshPublicContent();
    return { ok: true, id: rows[0].id };
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
