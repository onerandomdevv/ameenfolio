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
import {
  techStackItemSchema,
  techStackOrderSchema,
  type TechStackItemInput,
} from "@/lib/validation";

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

// Order and group arrive together because dragging changes both: moving a chip
// into the other column is the same gesture as moving it up the list. Written
// as one batch so a half-applied reorder cannot leave two items claiming the
// same position.
export async function reorderTechStack(
  order: { id: string; groupKey: string; displayOrder: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = techStackOrderSchema.safeParse(order);
  // The payload is built by the drag handler rather than typed by anyone, so a
  // failure here is a bug on our side, not something to point at a field.
  if (!parsed.success)
    return { ok: false, message: "Could not read the new order." };
  if (!parsed.data.length) return { ok: true };

  try {
    const db = getDb();
    const updatedAt = new Date();
    const writes = parsed.data.map((row) =>
      db
        .update(techStackItems)
        .set({
          groupKey: row.groupKey,
          displayOrder: row.displayOrder,
          updatedAt,
        })
        .where(eq(techStackItems.id, row.id)),
    );
    await db.batch(writes as [(typeof writes)[number], ...typeof writes]);
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_reorder_failed", {
      error: String(error),
    });
    return { ok: false, message: "Could not save the new order." };
  }
}
