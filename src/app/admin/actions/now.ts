"use server";

import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { nowLinks, nowSection } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { canAddNowLink, MAX_NOW_LINKS } from "@/lib/ordering";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import {
  nowLinkSchema,
  nowSectionSchema,
  type NowLinkInput,
  type NowSectionInput,
} from "@/lib/validation";

function touchSection(db: ReturnType<typeof getDb>, updatedAt: Date) {
  return db
    .insert(nowSection)
    .values({
      id: 1,
      description: "",
      published: false,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: nowSection.id,
      set: { updatedAt },
    });
}

export async function saveNowSection(
  input: NowSectionInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = nowSectionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await getDb()
      .insert(nowSection)
      .values({ id: 1, ...parsed.data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: nowSection.id,
        set: { ...parsed.data, updatedAt: new Date() },
      });
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.now_section_failed", { error: String(error) });
    return { ok: false, message: "The Now section could not be saved." };
  }
}

export async function saveNowLink(
  input: NowLinkInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = nowLinkSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const values = {
    ...parsed.data,
    iconKey: parsed.data.iconKey ?? null,
    iconAlt: parsed.data.iconAlt || null,
  };

  try {
    const db = getDb();
    const previous = id
      ? await db
          .select({ iconKey: nowLinks.iconKey })
          .from(nowLinks)
          .where(eq(nowLinks.id, id))
          .limit(1)
      : [];
    if (id && !previous[0]) {
      return { ok: false, message: "Now link not found." };
    }

    if (!id) {
      const [result] = await db.select({ value: count() }).from(nowLinks);
      if (!canAddNowLink(Number(result.value))) {
        return {
          ok: false,
          message: `Only ${MAX_NOW_LINKS} Now links can be created.`,
        };
      }
    }

    if (values.iconKey) {
      await assertStoredUpload(values.iconKey, "icon");
    }

    const linkId = id ?? randomUUID();
    const updatedAt = new Date();
    const linkMutation = id
      ? db
          .update(nowLinks)
          .set({ ...values, updatedAt })
          .where(eq(nowLinks.id, id))
      : db.insert(nowLinks).values({ id: linkId, ...values, updatedAt });

    await db.batch([linkMutation, touchSection(db, updatedAt)]);
    refreshPublicContent();
    if (previous[0]?.iconKey !== values.iconKey) {
      await deleteObject(previous[0]?.iconKey);
    }
    return { ok: true, id: linkId };
  } catch (error) {
    if (String(error).includes("now_links_limit_exceeded")) {
      return {
        ok: false,
        message: `Only ${MAX_NOW_LINKS} Now links can be created.`,
      };
    }
    logServer("error", "crud.now_link_failed", { id, error: String(error) });
    return { ok: false, message: "The Now link could not be saved." };
  }
}

export async function deleteNowLink(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const db = getDb();
    const [previous] = await db
      .select({ iconKey: nowLinks.iconKey })
      .from(nowLinks)
      .where(eq(nowLinks.id, id))
      .limit(1);
    if (!previous) return { ok: false, message: "Now link not found." };

    const updatedAt = new Date();
    await db.batch([
      db.delete(nowLinks).where(eq(nowLinks.id, id)),
      touchSection(db, updatedAt),
    ]);
    refreshPublicContent();
    await deleteObject(previous.iconKey);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.now_link_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The Now link could not be deleted." };
  }
}
