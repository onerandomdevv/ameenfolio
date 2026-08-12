"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import { projectSchema, type ProjectInput } from "@/lib/validation";

export async function saveProject(
  input: ProjectInput,
  id?: string,
  publish?: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  // published is not on the form. Creating from the Post button publishes;
  // saving a draft leaves it alone, which is what `publish` carries.
  const values = {
    ...parsed.data,
    contribution: parsed.data.contribution || null,
    statusLabel: parsed.data.statusLabel || null,
    iconKey: parsed.data.iconKey ?? null,
    iconAlt: parsed.data.iconAlt || null,
    ...(publish === undefined ? {} : { published: publish }),
  };
  try {
    if (values.iconKey) {
      await assertStoredUpload(values.iconKey, "icon");
    }
    if (id) {
      const previous = await getDb()
        .select({ iconKey: projects.iconKey })
        .from(projects)
        .where(eq(projects.id, id));
      const [row] = await getDb()
        .update(projects)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning({ id: projects.id });
      if (!row) return { ok: false, message: "Project not found." };
      refreshPublicContent();
      if (previous[0]?.iconKey !== values.iconKey) {
        await deleteObject(previous[0]?.iconKey);
      }
      return { ok: true, id: row.id };
    }

    const [row] = await getDb()
      .insert(projects)
      .values(values)
      .returning({ id: projects.id });
    refreshPublicContent();
    return { ok: true, id: row.id };
  } catch (error) {
    logServer("error", "crud.project_failed", { id, error: String(error) });
    return { ok: false, message: "The project could not be saved." };
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [deleted] = await getDb()
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ iconKey: projects.iconKey });
    if (!deleted) return { ok: false, message: "Project not found." };
    refreshPublicContent();
    await deleteObject(deleted.iconKey);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.project_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The project could not be deleted." };
  }
}
