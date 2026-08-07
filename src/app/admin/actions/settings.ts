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

  const values = {
    ...parsed.data,
    profileImageKey: parsed.data.profileImageKey ?? null,
    resumeKey: parsed.data.resumeKey ?? null,
    resumeFilename: parsed.data.resumeFilename || null,
  };

  try {
    if (values.resumeKey) {
      await assertStoredUpload(values.resumeKey, "resume");
    }
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
    await getDb()
      .insert(siteSettings)
      .values({ id: 1, ...values, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...values, updatedAt: new Date() },
      });
    refreshPublicContent();
    if (previous[0]?.resumeKey !== values.resumeKey) {
      await deleteObject(previous[0]?.resumeKey);
    }
    if (previous[0]?.profileImageKey !== values.profileImageKey) {
      await deleteObject(previous[0]?.profileImageKey);
    }
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.settings_failed", { error: String(error) });
    return { ok: false, message: "Settings could not be saved." };
  }
}
