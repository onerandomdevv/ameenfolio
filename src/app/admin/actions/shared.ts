import "server-only";

import { revalidatePath } from "next/cache";

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

// No tag invalidation: the public queries are no longer wrapped in a data
// cache, so there is no tagged entry left to expire. Clearing the route cache
// for the two public pages is what remains.
export function refreshPublicContent() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/writing");
}
