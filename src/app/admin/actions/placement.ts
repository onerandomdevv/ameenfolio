"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { countPinned } from "@/db/queries";
import { getDb } from "@/db/client";
import { posts, projects, recognitions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import {
  canPinPost,
  canPinProject,
  MAX_PINNED_POSTS,
  MAX_PINNED_PROJECTS,
} from "@/lib/ordering";
import {
  pinSchema,
  publishSchema,
  type PinInput,
  type PublishInput,
} from "@/lib/validation";

// Publishing and pinning are actions, not fields. The button on a form puts
// something on the site; the pin decides whether the homepage shows it. Taking
// something down is a delete, so there is no unpublish here.
export type PlacementKind = "project" | "post" | "recognition";

const tables = {
  project: projects,
  post: posts,
  recognition: recognitions,
} as const;

export async function setPublished(
  kind: PlacementKind,
  input: PublishInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const table = tables[kind];
    const [row] = await getDb()
      .update(table)
      .set({ published: parsed.data.published, updatedAt: new Date() })
      .where(eq(table.id, parsed.data.id))
      .returning({ id: table.id });
    if (!row) return { ok: false, message: "That no longer exists." };
    refreshPublicContent();
    return { ok: true, id: row.id };
  } catch (error) {
    logServer("error", "admin.publish_failed", { kind, error: String(error) });
    return { ok: false, message: "Could not change that." };
  }
}

export async function setPinned(
  kind: PlacementKind,
  input: PinInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Checked before the write so the owner gets a sentence rather than a
  // constraint violation. The database trigger is still the thing that makes
  // it true — this read cannot see a save happening at the same moment.
  if (parsed.data.pinned && kind !== "recognition") {
    const pinned = await countPinned(kind === "project" ? "projects" : "posts");
    const room =
      kind === "project" ? canPinProject(pinned) : canPinPost(pinned);
    if (!room) {
      const cap = kind === "project" ? MAX_PINNED_PROJECTS : MAX_PINNED_POSTS;
      return {
        ok: false,
        message: `Only ${cap} can be pinned to the homepage. Unpin one first.`,
      };
    }
  }

  try {
    const table = tables[kind];
    // The timestamp is the order: pinning writes now, so it lands at the top.
    const [row] = await getDb()
      .update(table)
      .set({
        pinnedAt: parsed.data.pinned ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(table.id, parsed.data.id))
      .returning({ id: table.id });
    if (!row) return { ok: false, message: "That no longer exists." };
    refreshPublicContent();
    return { ok: true, id: row.id };
  } catch (error) {
    if (String(error).includes("pinned to the homepage")) {
      return {
        ok: false,
        message: "That would go past the pin limit. Unpin one first.",
      };
    }
    logServer("error", "admin.pin_failed", { kind, error: String(error) });
    return { ok: false, message: "Could not change that." };
  }
}
