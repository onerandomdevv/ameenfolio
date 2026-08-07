"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { technologies } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import { technologySchema, type TechnologyInput } from "@/lib/validation";

export async function saveTechnology(
  input: TechnologyInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = technologySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    if (parsed.data.iconKey) {
      await assertStoredUpload(parsed.data.iconKey, "icon");
    }
    const previous = id
      ? await getDb()
          .select({ iconKey: technologies.iconKey })
          .from(technologies)
          .where(eq(technologies.id, id))
      : [];
    const rows = id
      ? await getDb()
          .update(technologies)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(technologies.id, id))
          .returning({ id: technologies.id })
      : await getDb()
          .insert(technologies)
          .values(parsed.data)
          .returning({ id: technologies.id });
    if (!rows[0]) return { ok: false, message: "Technology not found." };
    refreshPublicContent();
    if (previous[0]?.iconKey !== parsed.data.iconKey) {
      await deleteObject(previous[0]?.iconKey);
    }
    return { ok: true, id: rows[0].id };
  } catch (error) {
    logServer("error", "crud.technology_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The technology could not be saved." };
  }
}

export async function deleteTechnology(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [deleted] = await getDb()
      .delete(technologies)
      .where(eq(technologies.id, id))
      .returning({ iconKey: technologies.iconKey });
    if (!deleted) return { ok: false, message: "Technology not found." };
    refreshPublicContent();
    await deleteObject(deleted.iconKey);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.technology_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The technology could not be deleted." };
  }
}
