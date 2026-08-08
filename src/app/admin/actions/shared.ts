import "server-only";

import { revalidatePath, updateTag } from "next/cache";

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

// Called only from Server Actions, so updateTag applies: it expires the tag
// immediately and makes the next request wait for fresh data. revalidateTag
// only marks the entry stale, which let /projects keep serving a cached empty
// list after a project was published.
export function refreshPublicContent() {
  updateTag("portfolio");
  updateTag("projects");
  revalidatePath("/");
  revalidatePath("/projects");
}
