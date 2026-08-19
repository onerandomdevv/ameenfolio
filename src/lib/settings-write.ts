import type { SiteSettings, siteSettings } from "@/db/schema";

export type WritableSettings = Partial<typeof siteSettings.$inferInsert>;

/**
 * Builds the two halves of the settings upsert.
 *
 * They are deliberately different. `insert` carries every column, because the
 * row may not exist yet and `email`, `seo_title` and `seo_description` are NOT
 * NULL with no default. `update` carries only what was submitted, because
 * everything else was read before the write: two saves that overlap would each
 * write the other's columns back from their own stale snapshot, and whichever
 * landed second would silently undo the first.
 *
 * Extracted from the action so this shape can be asserted directly — a server
 * action module can only export async functions, and the property worth pinning
 * is which columns each half touches.
 */
export function buildSettingsWrite(
  current: SiteSettings,
  changes: WritableSettings,
  now: Date,
) {
  return {
    insert: {
      id: 1 as const,
      displayName: current.displayName,
      role: current.role,
      introduction: current.introduction,
      email: current.email,
      contactLinks: current.contactLinks ?? {},
      profileImageKey: current.profileImageKey,
      resumeKey: current.resumeKey,
      resumeFilename: current.resumeFilename,
      hackathonWins: current.hackathonWins,
      availability: current.availability,
      seoTitle: current.seoTitle,
      seoDescription: current.seoDescription,
      ...changes,
      updatedAt: now,
    },
    update: { ...changes, updatedAt: now },
  };
}
