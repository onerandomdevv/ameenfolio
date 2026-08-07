"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation";

export async function saveSettings(
  input: SiteSettingsInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    if (parsed.data.resumeKey) {
      await assertStoredUpload(parsed.data.resumeKey, "resume");
    }
    if (parsed.data.profileImageKey) {
      await assertStoredUpload(parsed.data.profileImageKey, "profile");
    }
    const previous = await getDb()
      .select({
        profileImageKey: siteSettings.profileImageKey,
        resumeKey: siteSettings.resumeKey,
      })
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
    if (previous[0]?.profileImageKey !== parsed.data.profileImageKey) {
      await deleteObject(previous[0]?.profileImageKey);
    }
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.settings_failed", { error: String(error) });
    return { ok: false, message: "Settings could not be saved." };
  }
}
