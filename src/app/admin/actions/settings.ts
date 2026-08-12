"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { getAdminSettings } from "@/db/queries";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import {
  buildSettingsWrite,
  type WritableSettings,
} from "@/lib/settings-write";
import { logServer } from "@/lib/logger";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import {
  profileSchema,
  seoSchema,
  type ProfileInput,
  type SeoInput,
} from "@/lib/validation";

/**
 * Profile and SEO live on separate screens but in one row, so each save has to
 * touch only its own columns. `buildSettingsWrite` is where that split lives,
 * and why the insert and the update carry different sets.
 */
async function writeSettings(changes: WritableSettings) {
  const current = await getAdminSettings();
  const { insert, update } = buildSettingsWrite(current, changes, new Date());

  await getDb()
    .insert(siteSettings)
    .values(insert)
    .onConflictDoUpdate({ target: siteSettings.id, set: update });

  refreshPublicContent();
}

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const values = {
    ...parsed.data,
    profileImageKey: parsed.data.profileImageKey ?? null,
    resumeKey: parsed.data.resumeKey ?? null,
    resumeFilename: parsed.data.resumeFilename || null,
  };

  try {
    if (values.resumeKey) await assertStoredUpload(values.resumeKey, "resume");
    if (values.profileImageKey) {
      await assertStoredUpload(values.profileImageKey, "profile");
    }

    const previous = await getDb()
      .select({
        profileImageKey: siteSettings.profileImageKey,
        resumeKey: siteSettings.resumeKey,
      })
      .from(siteSettings)
      .where(eq(siteSettings.id, 1));

    await writeSettings(values);

    // Only after the new key is safely stored: deleting first would leave the
    // site with no image if the write failed.
    if (previous[0]?.resumeKey !== values.resumeKey) {
      await deleteObject(previous[0]?.resumeKey);
    }
    if (previous[0]?.profileImageKey !== values.profileImageKey) {
      await deleteObject(previous[0]?.profileImageKey);
    }
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.profile_failed", { error: String(error) });
    return { ok: false, message: "Profile could not be saved." };
  }
}

export async function saveSeo(input: SeoInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await writeSettings(parsed.data);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.seo_failed", { error: String(error) });
    return { ok: false, message: "Settings could not be saved." };
  }
}
