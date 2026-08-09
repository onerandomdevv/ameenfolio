"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { techStackItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { techStackItemSchema, type TechStackItemInput } from "@/lib/validation";

export async function saveTechStackItem(
  input: TechStackItemInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = techStackItemSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    if (id) {
      await getDb()
        .update(techStackItems)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(techStackItems.id, id));
    } else {
      await getDb().insert(techStackItems).values(parsed.data);
    }
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_save_failed", { error: String(error) });
    return { ok: false, message: "Technology could not be saved." };
  }
}

export async function deleteTechStackItem(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await getDb().delete(techStackItems).where(eq(techStackItems.id, id));
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_delete_failed", {
      error: String(error),
    });
    return { ok: false, message: "Technology could not be deleted." };
  }
}
