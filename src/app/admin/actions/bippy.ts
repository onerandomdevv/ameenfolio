"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { deleteAssistantMemory } from "@/lib/ai/memory";
import { logServer } from "@/lib/logger";
import {
  bippyVisibilitySchema,
  type BippyVisibilityInput,
} from "@/lib/validation";

export async function saveBippyVisibility(
  input: BippyVisibilityInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bippyVisibilitySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const updated = await getDb()
      .update(siteSettings)
      .set({
        publicBippyEnabled: parsed.data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 1))
      .returning({ id: siteSettings.id });

    if (!updated[0]) {
      return {
        ok: false,
        message:
          "Save the main site settings before changing Bippy visibility.",
      };
    }

    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.bippy_visibility_failed", {
      error: String(error),
    });
    return { ok: false, message: "Bippy visibility could not be saved." };
  }
}

export async function forgetBippyMemory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid memory." };

  try {
    const deleted = await deleteAssistantMemory(parsed.data);
    return deleted
      ? { ok: true }
      : { ok: false, message: "That memory no longer exists." };
  } catch (error) {
    logServer("error", "assistant.memory_delete_failed", {
      memoryId: parsed.data,
      error: String(error),
    });
    return { ok: false, message: "The memory could not be forgotten." };
  }
}
