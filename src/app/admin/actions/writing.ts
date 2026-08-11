"use server";

import { randomUUID } from "node:crypto";
import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { postCategories, postLinks, posts } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { canPinPost } from "@/lib/ordering";
import { renderMarkdown } from "@/lib/writing/markdown";
import {
  postCategorySchema,
  postSchema,
  type PostCategoryInput,
  type PostInput,
} from "@/lib/validation";

// The index and the post itself both change when a post is saved, and the
// homepage changes when a pinned one does. Cheaper to clear all three than to
// work out which apply.
function refreshWriting(slug?: string) {
  refreshPublicContent();
  revalidatePath("/writing");
  if (slug) revalidatePath(`/writing/${slug}`);
}

async function pinSlotAvailable(excludeId?: string) {
  const where = excludeId
    ? and(
        eq(posts.pinned, true),
        eq(posts.published, true),
        ne(posts.id, excludeId),
      )
    : and(eq(posts.pinned, true), eq(posts.published, true));
  const [result] = await getDb()
    .select({ value: count() })
    .from(posts)
    .where(where);
  return canPinPost(Number(result.value));
}

export async function savePost(
  input: PostInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  if (
    parsed.data.published &&
    parsed.data.pinned &&
    !(await pinSlotAvailable(id))
  ) {
    return {
      ok: false,
      message: "Only five published posts can be pinned to the homepage.",
    };
  }

  // Rendered here rather than on read: the public pages are force-dynamic, so
  // parsing on every request would repeat this for a result that only changes
  // when the post is saved.
  const { html, headings } = await renderMarkdown(parsed.data.bodyMarkdown);

  const values = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    bodyMarkdown: parsed.data.bodyMarkdown,
    bodyHtml: html,
    headings,
    categoryId: parsed.data.categoryId,
    publishedAt: parsed.data.publishedAt,
    published: parsed.data.published,
    pinned: parsed.data.pinned,
    pinnedOrder: parsed.data.pinnedOrder,
  };

  try {
    const db = getDb();

    // Read first, for two reasons: an edit of a row that has since been
    // deleted must not silently insert, and renaming a post leaves a cached
    // page at the old address that has to be cleared too.
    let previousSlug: string | undefined;
    if (id) {
      const [existing] = await db
        .select({ slug: posts.slug })
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);
      if (!existing)
        return { ok: false, message: "That post no longer exists." };
      previousSlug = existing.slug;
    }

    // Generated up front so the links can be written in the same batch as the
    // post rather than waiting on a returned id.
    const postId = id ?? randomUUID();
    const updatedAt = new Date();
    const postMutation = id
      ? db
          .update(posts)
          .set({ ...values, updatedAt })
          .where(eq(posts.id, id))
      : db.insert(posts).values({ id: postId, ...values, updatedAt });

    // Links are replaced wholesale rather than diffed: the form submits the
    // list it wants, and a link carries no state worth preserving.
    //
    // Batched, not issued one after another. db.transaction() throws on the
    // neon-http driver, but a batch is sent as a single transaction — so a
    // failure part way through cannot leave the post saved with its links
    // already deleted while the caller is told the save failed.
    const linkRows = parsed.data.links.map((link) => ({ ...link, postId }));
    const clearLinks = db.delete(postLinks).where(eq(postLinks.postId, postId));
    // Two literal batches rather than one spread array: batch takes a
    // non-empty tuple, and a conditional spread widens it to a plain array
    // that no longer satisfies that.
    await (linkRows.length
      ? db.batch([
          postMutation,
          clearLinks,
          db.insert(postLinks).values(linkRows),
        ])
      : db.batch([postMutation, clearLinks]));

    refreshWriting(parsed.data.slug);
    if (previousSlug && previousSlug !== parsed.data.slug) {
      refreshWriting(previousSlug);
    }
    return { ok: true, id: postId };
  } catch (error) {
    logServer("error", "admin.post_save_failed", { error: String(error) });
    return {
      ok: false,
      message: isUniqueSlugViolation(error)
        ? "Another post already uses that address."
        : "Could not save the post.",
    };
  }
}

function isUniqueSlugViolation(error: unknown) {
  return String(error).includes("posts_slug_idx");
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [row] = await getDb()
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ slug: posts.slug });
    refreshWriting(row?.slug);
    return { ok: true };
  } catch (error) {
    logServer("error", "admin.post_delete_failed", { error: String(error) });
    return { ok: false, message: "Could not delete the post." };
  }
}

export async function savePostCategory(
  input: PostCategoryInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postCategorySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const db = getDb();
    if (id) {
      await db
        .update(postCategories)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(postCategories.id, id));
    } else {
      await db.insert(postCategories).values(parsed.data);
    }
    refreshWriting();
    return { ok: true };
  } catch (error) {
    logServer("error", "admin.post_category_save_failed", {
      error: String(error),
    });
    return {
      ok: false,
      message: String(error).includes("post_categories_name_idx")
        ? "A category with that name already exists."
        : "Could not save the category.",
    };
  }
}

// Posts keep their place: the column is set null on delete, so removing a
// category regroups its writing rather than taking it down.
export async function deletePostCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await getDb().delete(postCategories).where(eq(postCategories.id, id));
    refreshWriting();
    return { ok: true };
  } catch (error) {
    logServer("error", "admin.post_category_delete_failed", {
      error: String(error),
    });
    return { ok: false, message: "Could not delete the category." };
  }
}
