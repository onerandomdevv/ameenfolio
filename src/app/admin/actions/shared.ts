import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fields?: Record<string, string[]> };

export function validationFailure(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ActionResult {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    fields: error.flatten().fieldErrors,
  };
}

export function refreshPublicContent() {
  revalidateTag("portfolio", "max");
  revalidateTag("projects", "max");
  revalidatePath("/");
  revalidatePath("/projects");
}
