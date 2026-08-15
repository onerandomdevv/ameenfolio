import "server-only";

import { and, eq, lt, ne, notExists, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentMediaUploads, posts } from "@/db/schema";
import { logServer } from "@/lib/logger";
import { cleanupExpiredArticleImages } from "@/lib/mcp/article-image-cleanup";
import { deleteObjectOrThrow } from "@/lib/storage/server";

export function cleanupExpiredArticleImagesForMcp(now = new Date()) {
  const db = getDb();
  return cleanupExpiredArticleImages(now, {
    selectExpired: (cutoff) =>
      db
        .select({
          id: agentMediaUploads.id,
          objectKey: agentMediaUploads.objectKey,
        })
        .from(agentMediaUploads)
        .where(
          and(
            lt(agentMediaUploads.createdAt, cutoff),
            ne(agentMediaUploads.status, "deleted"),
          ),
        ),
    claimForDeletion: async (upload) => {
      const mediaPath = `/media/${upload.objectKey}`;
      const lock = db
        .select({
          locked: sql`pg_advisory_xact_lock(hashtextextended(${upload.objectKey}, 0))`,
        })
        .from(sql`(select 1) as article_image_lock`);
      const claim = db
        .update(agentMediaUploads)
        .set({ status: "deleting" })
        .where(
          and(
            eq(agentMediaUploads.id, upload.id),
            ne(agentMediaUploads.status, "deleted"),
            or(
              eq(agentMediaUploads.status, "pending"),
              eq(agentMediaUploads.status, "deleting"),
              and(
                eq(agentMediaUploads.status, "ready"),
                notExists(
                  db
                    .select({ id: posts.id })
                    .from(posts)
                    .where(
                      sql`position(${mediaPath} in ${posts.bodyMarkdown}) > 0`,
                    ),
                ),
              ),
            ),
          ),
        )
        .returning({ id: agentMediaUploads.id });
      const [, claimed] = await db.batch([lock, claim]);
      return claimed.length > 0;
    },
    deleteObject: deleteObjectOrThrow,
    markDeleted: async (id) => {
      await db
        .update(agentMediaUploads)
        .set({ status: "deleted" })
        .where(eq(agentMediaUploads.id, id));
    },
    log: logServer,
  });
}
