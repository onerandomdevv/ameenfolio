"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDb } from "@/db/client";
import { projects, recognitions, siteSettings, technologies } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { assertStoredUpload, deleteObject } from "@/lib/storage";
import {
  projectSchema,
  recognitionSchema,
  siteSettingsSchema,
  technologySchema,
  type ProjectInput,
  type RecognitionInput,
  type SiteSettingsInput,
  type TechnologyInput,
} from "@/lib/validation";
import { logServer } from "@/lib/logger";
import { canAddHomepageProject } from "@/lib/ordering";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fields?: Record<string, string[]> };

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionResult {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    fields: error.flatten().fieldErrors,
  };
}

function refreshPublicContent() {
  revalidateTag("portfolio", "max");
  revalidateTag("projects", "max");
  revalidatePath("/");
  revalidatePath("/projects");
}

async function homepageLimitAvailable(excludeId?: string) {
  const where = excludeId
    ? and(
        eq(projects.showOnHomepage, true),
        eq(projects.published, true),
        ne(projects.id, excludeId),
      )
    : and(eq(projects.showOnHomepage, true), eq(projects.published, true));
  const [result] = await getDb().select({ value: count() }).from(projects).where(where);
  return canAddHomepageProject(Number(result.value));
}

export async function saveProject(
  input: ProjectInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (
    parsed.data.published &&
    parsed.data.showOnHomepage &&
    !(await homepageLimitAvailable(id))
  ) {
    return { ok: false, message: "Only eight published projects can appear on the homepage." };
  }
  try {
    if (parsed.data.iconKey) await assertStoredUpload(parsed.data.iconKey, "icon");
    if (id) {
      const previous = await getDb()
        .select({ iconKey: projects.iconKey })
        .from(projects)
        .where(eq(projects.id, id));
      const [row] = await getDb()
        .update(projects)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning({ id: projects.id });
      if (!row) return { ok: false, message: "Project not found." };
      refreshPublicContent();
      if (previous[0]?.iconKey !== parsed.data.iconKey) {
        await deleteObject(previous[0]?.iconKey);
      }
      return { ok: true, id: row.id };
    }
    const [row] = await getDb().insert(projects).values(parsed.data).returning({ id: projects.id });
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
    logServer("error", "crud.project_delete_failed", { id, error: String(error) });
    return { ok: false, message: "The project could not be deleted." };
  }
}

export async function saveRecognition(
  input: RecognitionInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = recognitionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    if (parsed.data.iconKey) await assertStoredUpload(parsed.data.iconKey, "icon");
    const previous = id
      ? await getDb()
          .select({ iconKey: recognitions.iconKey })
          .from(recognitions)
          .where(eq(recognitions.id, id))
      : [];
    const rows = id
      ? await getDb()
          .update(recognitions)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(recognitions.id, id))
          .returning({ id: recognitions.id })
      : await getDb()
          .insert(recognitions)
          .values(parsed.data)
          .returning({ id: recognitions.id });
    if (!rows[0]) return { ok: false, message: "Recognition not found." };
    refreshPublicContent();
    if (previous[0]?.iconKey !== parsed.data.iconKey) {
      await deleteObject(previous[0]?.iconKey);
    }
    return { ok: true, id: rows[0].id };
  } catch (error) {
    logServer("error", "crud.recognition_failed", { id, error: String(error) });
    return { ok: false, message: "The recognition could not be saved." };
  }
}

export async function deleteRecognition(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [deleted] = await getDb()
      .delete(recognitions)
      .where(eq(recognitions.id, id))
      .returning({ iconKey: recognitions.iconKey });
    if (!deleted) return { ok: false, message: "Recognition not found." };
    refreshPublicContent();
    await deleteObject(deleted.iconKey);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.recognition_delete_failed", { id, error: String(error) });
    return { ok: false, message: "The recognition could not be deleted." };
  }
}

export async function saveTechnology(
  input: TechnologyInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = technologySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    if (parsed.data.iconKey) await assertStoredUpload(parsed.data.iconKey, "icon");
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
    logServer("error", "crud.technology_failed", { id, error: String(error) });
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
    logServer("error", "crud.technology_delete_failed", { id, error: String(error) });
    return { ok: false, message: "The technology could not be deleted." };
  }
}

export async function saveSettings(input: SiteSettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    if (parsed.data.resumeKey) {
      await assertStoredUpload(parsed.data.resumeKey, "resume");
    }
    const previous = await getDb()
      .select({ resumeKey: siteSettings.resumeKey })
      .from(siteSettings)
      .where(eq(siteSettings.id, 1));
    await getDb()
      .insert(siteSettings)
      .values({ id: 1, ...parsed.data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...parsed.data, updatedAt: new Date() },
      });
    refreshPublicContent();
    if (previous[0]?.resumeKey !== parsed.data.resumeKey) {
      await deleteObject(previous[0]?.resumeKey);
    }
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.settings_failed", { error: String(error) });
    return { ok: false, message: "Settings could not be saved." };
  }
}
